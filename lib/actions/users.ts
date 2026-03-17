/**
 * @module lib/actions/users
 * @description Server actions for centralized user management.
 *
 * Exports:
 * - `createUserForOrg` — creates a user in any org (SuperAdmin) or own org (Admin)
 * - `updateUser`       — updates name, username, role, active, org (SuperAdmin can move user)
 * - `deleteUser`       — soft-deactivates a user (preserves audit trail)
 * - `changePassword`   — self-service password change
 * - `adminResetPassword` — admin resets another user's password
 * - `getUsers`         — lists users in caller's org (Admin)
 * - `getAllUsers`       — lists ALL users across ALL orgs with orgName (SuperAdmin only)
 * - `getSalesUsers`    — active SALES users for lead assignment dropdowns
 *
 * Security model:
 *   SuperAdmin → manages any user in any org
 *   Admin      → manages users in own org only
 *   All roles enforced by USER_ROLES enum at schema + action level
 */
"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User, { USER_ROLES, type UserRole } from "@/models/User";
import Organization from "@/models/Organization";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { logAudit } from "@/lib/actions/audit";
import { AUDIT_ACTIONS, ENTITY_TYPES } from "@/models/AuditLog";
import mongoose from "mongoose";

// ─── Password complexity ────────────────────────────────────────────────────

function validatePasswordComplexity(pw: string): string | null {
    if (pw.length < 8) return "Password must be at least 8 characters";
    if (!/[A-Z]/.test(pw)) return "Password must contain at least one uppercase letter";
    if (!/[a-z]/.test(pw)) return "Password must contain at least one lowercase letter";
    if (!/[0-9]/.test(pw)) return "Password must contain at least one number";
    return null; // Valid
}

// ─── Validation schemas ────────────────────────────────────────────────────

const ALLOWED_ROLES = Object.values(USER_ROLES) as string[];

const CreateUserSchema = z.object({
    name: z.string().min(2, "Name must be at least 2 characters"),
    username: z
        .string()
        .min(3, "Username must be at least 3 characters")
        .regex(/^[a-zA-Z0-9_.-]+$/, "Username: letters, numbers, dots, hyphens, underscores only"),
    password: z.string().min(8, "Password must be at least 8 characters"),
    role: z.enum(["ADMIN", "MARKETING", "SALES"]),
    targetOrgId: z.string().optional(),
});

// ─── Helper: resolve which orgId to use ────────────────────────────────────

async function resolveOrgId(
    session: any,
    targetOrgId?: string | null
): Promise<{ orgId: string; error?: string }> {
    const isSuperAdmin = !!(session?.user?.isSuperAdmin);
    const sessionOrgId = session?.user?.orgId as string;

    if (!targetOrgId || !isSuperAdmin) {
        // Regular Admin → always use own org, ignore targetOrgId
        if (!sessionOrgId) return { orgId: "", error: "No organization in session" };
        return { orgId: sessionOrgId };
    }

    // SuperAdmin with explicit targetOrgId → validate it exists
    const org = await Organization.findById(targetOrgId).select("_id").lean();
    if (!org) return { orgId: "", error: "Target organization not found" };
    return { orgId: targetOrgId };
}

// ─── Create user ────────────────────────────────────────────────────────────

/**
 * Creates a new user.
 * - Admin: always creates in their own org, targetOrgId is ignored
 * - SuperAdmin: can pass targetOrgId to create in any org
 */
export async function createUserForOrg(data: {
    name: string;
    username: string;
    password: string;
    role: string;
    targetOrgId?: string;
}) {
    const session = await auth();
    if (!session?.user) return { message: "Unauthorized" };

    const isSuperAdmin = !!(session.user as any).isSuperAdmin;
    const isAdmin = (session.user as any).role === USER_ROLES.ADMIN;

    if (!isSuperAdmin && !isAdmin) {
        return { message: "Forbidden: Admin access required" };
    }

    // Validate input
    const parsed = CreateUserSchema.safeParse({
        name: data.name,
        username: data.username,
        password: data.password,
        role: data.role,
        targetOrgId: data.targetOrgId,
    });
    if (!parsed.success) {
        return { message: parsed.error.issues[0]?.message || "Invalid input" };
    }

    const { name, username, password, role } = parsed.data;

    // Server-side password complexity check
    const complexityError = validatePasswordComplexity(password);
    if (complexityError) return { message: complexityError };

    try {
        await dbConnect();

        // Resolve and validate target org
        const { orgId, error } = await resolveOrgId(session, data.targetOrgId);
        if (error) return { message: error };

        // Username uniqueness within target org
        const existing = await User.findOne({ username: username.toLowerCase(), orgId });
        if (existing) return { message: `Username "${username}" already exists in this organization` };

        const passwordHash = await bcrypt.hash(password, 12);
        const newUser = await User.create({
            orgId,
            name,
            username: username.toLowerCase(),
            passwordHash,
            role: role as UserRole,
            active: true,
        });

        const org = await Organization.findById(orgId).select("name").lean() as any;
        logAudit(
            AUDIT_ACTIONS.CREATE,
            ENTITY_TYPES.USER,
            newUser._id.toString(),
            `Created user: ${name} (${role}) in org: ${org?.name || orgId}`
        );
        revalidatePath("/settings");
        return { success: true, message: `User "${name}" created successfully` };
    } catch (err: any) {
        console.error("createUserForOrg error:", err);
        return { message: err.message || "Failed to create user" };
    }
}

// Backward-compatible FormData alias (used by existing createUser calls)
export async function createUser(prevState: any, formData: FormData) {
    return createUserForOrg({
        name: formData.get("name") as string,
        username: formData.get("username") as string,
        password: formData.get("password") as string,
        role: formData.get("role") as string || USER_ROLES.SALES,
        targetOrgId: formData.get("targetOrgId") as string || undefined,
    });
}

export const createSalesUser = createUser;

// ─── Update user ────────────────────────────────────────────────────────────

/**
 * Updates user fields. SuperAdmin can also move user to different org.
 */
export async function updateUser(
    userId: string,
    data: {
        name?: string;
        username?: string;
        role?: string;
        active?: boolean;
        targetOrgId?: string;
    }
) {
    const session = await auth();
    if (!session?.user) return { message: "Unauthorized" };

    const isSuperAdmin = !!(session.user as any).isSuperAdmin;
    const isAdmin = (session.user as any).role === USER_ROLES.ADMIN;
    if (!isSuperAdmin && !isAdmin) return { message: "Forbidden" };

    const sessionOrgId = (session.user as any).orgId as string;

    try {
        await dbConnect();

        // Admin can only edit users in own org
        const orgFilter = isSuperAdmin ? { _id: userId } : { _id: userId, orgId: sessionOrgId };
        const user = await User.findOne(orgFilter);
        if (!user) return { message: "User not found" };
        if (user.isSuperAdmin && !isSuperAdmin) return { message: "Cannot modify SuperAdmin users" };

        // Validate role if provided
        if (data.role !== undefined) {
            if (!ALLOWED_ROLES.includes(data.role)) {
                return { message: `Invalid role "${data.role}". Allowed: ${ALLOWED_ROLES.join(", ")}` };
            }
            user.role = data.role as UserRole;
        }

        if (data.name !== undefined) user.name = data.name;

        if (data.username !== undefined) {
            const targetOrgId = data.targetOrgId || user.orgId.toString();
            const taken = await User.findOne({
                username: data.username.toLowerCase(),
                orgId: targetOrgId,
                _id: { $ne: userId },
            });
            if (taken) return { message: "Username already taken in this organization" };
            user.username = data.username.toLowerCase();
        }

        if (data.active !== undefined) user.active = data.active;

        // SuperAdmin can reassign user to a different org
        if (data.targetOrgId && isSuperAdmin) {
            const org = await Organization.findById(data.targetOrgId).select("_id").lean();
            if (!org) return { message: "Target organization not found" };
            user.orgId = new mongoose.Types.ObjectId(data.targetOrgId);
        }

        await user.save();
        logAudit(AUDIT_ACTIONS.UPDATE, ENTITY_TYPES.USER, userId, `Updated user: ${user.name}`);
        revalidatePath("/settings");
        return { success: true, message: "User updated successfully" };
    } catch (err: any) {
        console.error("updateUser error:", err);
        return { message: err.message || "Failed to update user" };
    }
}

// ─── Deactivate user (soft-delete) ─────────────────────────────────────────

export async function deleteUser(userId: string) {
    const session = await auth();
    if (!session?.user) return { message: "Unauthorized" };

    const isSuperAdmin = !!(session.user as any).isSuperAdmin;
    const isAdmin = (session.user as any).role === USER_ROLES.ADMIN;
    if (!isSuperAdmin && !isAdmin) return { message: "Forbidden" };

    if ((session.user as any).id === userId) {
        return { message: "Cannot deactivate your own account" };
    }

    const sessionOrgId = (session.user as any).orgId as string;

    try {
        await dbConnect();
        const orgFilter = isSuperAdmin ? { _id: userId } : { _id: userId, orgId: sessionOrgId };
        const user = await User.findOne(orgFilter);
        if (!user) return { message: "User not found" };
        if (user.isSuperAdmin) return { message: "Cannot deactivate SuperAdmin users" };

        user.active = false;
        await user.save();
        logAudit(AUDIT_ACTIONS.DELETE, ENTITY_TYPES.USER, userId, `Deactivated user: ${user.name}`);
        revalidatePath("/settings");
        return { success: true, message: `User "${user.name}" deactivated successfully` };
    } catch (err: any) {
        console.error("deleteUser error:", err);
        return { message: err.message || "Failed to deactivate user" };
    }
}

// ─── Reactivate user ────────────────────────────────────────────────────────

export async function reactivateUser(userId: string) {
    const session = await auth();
    if (!session?.user) return { message: "Unauthorized" };

    const isSuperAdmin = !!(session.user as any).isSuperAdmin;
    const isAdmin = (session.user as any).role === USER_ROLES.ADMIN;
    if (!isSuperAdmin && !isAdmin) return { message: "Forbidden" };

    const sessionOrgId = (session.user as any).orgId as string;

    try {
        await dbConnect();
        const orgFilter = isSuperAdmin ? { _id: userId } : { _id: userId, orgId: sessionOrgId };
        const user = await User.findOne(orgFilter);
        if (!user) return { message: "User not found" };

        user.active = true;
        await user.save();
        logAudit(AUDIT_ACTIONS.UPDATE, ENTITY_TYPES.USER, userId, `Reactivated user: ${user.name}`);
        revalidatePath("/settings");
        return { success: true, message: `User "${user.name}" reactivated` };
    } catch (err: any) {
        console.error("reactivateUser error:", err);
        return { message: err.message || "Failed to reactivate user" };
    }
}

// ─── Password management ────────────────────────────────────────────────────

export async function changePassword(oldPassword: string, newPassword: string) {
    const session = await auth();
    if (!session) return { message: "Unauthorized" };

    if (newPassword.length < 8) return { message: "Password must be at least 8 characters" };
    const complexityError = validatePasswordComplexity(newPassword);
    if (complexityError) return { message: complexityError };

    try {
        await dbConnect();
        const user = await User.findById((session.user as any).id);
        if (!user) return { message: "User not found" };

        const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isValid) return { message: "Current password is incorrect" };

        user.passwordHash = await bcrypt.hash(newPassword, 12);
        await user.save();
        return { success: true, message: "Password changed successfully" };
    } catch (err: any) {
        console.error("changePassword error:", err);
        return { message: "Failed to change password" };
    }
}

export async function adminResetPassword(userId: string, newPassword: string) {
    const session = await auth();
    if (!session?.user) return { message: "Unauthorized" };

    const isSuperAdmin = !!(session.user as any).isSuperAdmin;
    const isAdmin = (session.user as any).role === USER_ROLES.ADMIN;
    if (!isSuperAdmin && !isAdmin) return { message: "Forbidden" };

    if (!newPassword || newPassword.length < 8) return { message: "Password must be at least 8 characters" };
    const complexityError = validatePasswordComplexity(newPassword);
    if (complexityError) return { message: complexityError };

    const sessionOrgId = (session.user as any).orgId as string;

    try {
        await dbConnect();
        const orgFilter = isSuperAdmin ? { _id: userId } : { _id: userId, orgId: sessionOrgId };
        const user = await User.findOne(orgFilter);
        if (!user) return { message: "User not found" };

        user.passwordHash = await bcrypt.hash(newPassword, 12);
        await user.save();
        logAudit(AUDIT_ACTIONS.UPDATE, ENTITY_TYPES.USER, userId, `Admin reset password for: ${user.name}`);
        return { success: true, message: `Password reset for ${user.name}` };
    } catch (err: any) {
        console.error("adminResetPassword error:", err);
        return { message: "Failed to reset password" };
    }
}

// ─── Queries ─────────────────────────────────────────────────────────────────

/**
 * Get users in the Admin's own org (Admin view).
 */
export async function getUsers() {
    const session = await auth();
    if (!session?.user) return [];

    const isSuperAdmin = !!(session.user as any).isSuperAdmin;
    const isAdmin = (session.user as any).role === USER_ROLES.ADMIN;
    if (!isSuperAdmin && !isAdmin) return [];

    try {
        await dbConnect();
        const orgId = (session.user as any).orgId;
        const users = await User.find({ orgId })
            .select("-passwordHash")
            .sort({ role: 1, name: 1 })
            .lean();

        return users.map((u: any) => ({
            ...u,
            _id: u._id.toString(),
            orgId: u.orgId?.toString() || "",
            orgName: null,
            createdAt: u.createdAt?.toISOString(),
            updatedAt: u.updatedAt?.toISOString(),
            lastLogin: u.lastLogin?.toISOString() || null,
        }));
    } catch (err) {
        console.error("getUsers error:", err);
        return [];
    }
}

/**
 * Get ALL users across ALL organizations (SuperAdmin only).
 * Populates orgName for display.
 */
export async function getAllUsers() {
    const session = await auth();
    if (!(session?.user as any)?.isSuperAdmin) return [];

    try {
        await dbConnect();

        // Aggregate users with org name in one query
        const users = await User.aggregate([
            {
                $lookup: {
                    from: "organizations",
                    localField: "orgId",
                    foreignField: "_id",
                    as: "org",
                    pipeline: [{ $project: { name: 1, slug: 1, active: 1 } }],
                },
            },
            { $unwind: { path: "$org", preserveNullAndEmptyArrays: true } },
            { $project: { passwordHash: 0 } },  // 🔒 Never expose hash
            { $sort: { "org.name": 1, role: 1, name: 1 } },
        ]);

        return users.map((u: any) => ({
            _id: u._id.toString(),
            orgId: u.orgId?.toString() || "",
            orgName: u.org?.name || "Unknown",
            orgSlug: u.org?.slug || "",
            orgActive: u.org?.active ?? true,
            name: u.name,
            username: u.username || "",
            role: u.role,
            active: u.active,
            isSuperAdmin: u.isSuperAdmin || false,
            lastLogin: u.lastLogin ? new Date(u.lastLogin).toISOString() : null,
            createdAt: u.createdAt ? new Date(u.createdAt).toISOString() : "",
            updatedAt: u.updatedAt ? new Date(u.updatedAt).toISOString() : "",
        }));
    } catch (err) {
        console.error("getAllUsers error:", err);
        return [];
    }
}

/**
 * Get active SALES users for lead assignment dropdowns.
 */
export async function getSalesUsers() {
    const session = await auth();
    if (!session?.user?.orgId) return [];

    const role = (session.user as any).role;
    if (role !== USER_ROLES.ADMIN && role !== USER_ROLES.MARKETING) return [];

    try {
        await dbConnect();
        const users = await User.find({
            orgId: (session.user as any).orgId,
            role: USER_ROLES.SALES,
            active: true,
        })
            .select("-passwordHash")
            .sort({ name: 1 })
            .lean();

        return users.map((u: any) => ({
            _id: u._id.toString(),
            orgId: u.orgId?.toString() || "",
            name: u.name,
            username: u.username || "",
            role: u.role,
            active: u.active,
            createdAt: u.createdAt?.toISOString(),
            updatedAt: u.updatedAt?.toISOString(),
        }));
    } catch (err) {
        console.error("getSalesUsers error:", err);
        return [];
    }
}
