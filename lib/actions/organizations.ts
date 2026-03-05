/**
 * @module lib/actions/organizations
 * @description Server actions for multi-tenant organisation management (SuperAdmin).
 *
 * Exports (15 functions):
 * - CRUD: `createOrganization`, `getOrganizations`, `getOrgById`, `updateOrg`, `deleteOrganization`
 * - Lifecycle: `suspendOrganization`, `reactivateOrganization`, `cloneOrganization`
 * - Analytics: `getCrossOrgStats`, `getActiveOrganizations`
 * - Hard delete: `hardDeleteOrganization` — cascading 9-collection cleanup
 * - Settings: `getOrgSettings`, `updateOrgSettings`, `updateOrgBranding`
 * - Export: `exportOrganization`
 *
 * All mutations require SuperAdmin privileges.
 */
"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import Organization from "@/models/Organization";
import User from "@/models/User";
import Lead from "@/models/Lead";
import { USER_ROLES } from "@/models/User";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import mongoose from "mongoose";

// ─── Default settings template for new organizations ─────────────────────────
const DEFAULT_STATUSES = [
    { key: "new", label: "New", color: "#3b82f6" },
    { key: "contacted", label: "Contacted", color: "#f59e0b" },
    { key: "qualified", label: "Qualified", color: "#8b5cf6" },
    { key: "proposal", label: "Proposal", color: "#6366f1" },
    { key: "negotiation", label: "Negotiation", color: "#ec4899" },
    { key: "customer", label: "Customer", color: "#10b981" },
    { key: "lost", label: "Lost", color: "#ef4444" },
];

const DEFAULT_SOURCES = [
    { key: "website", label: "Website" },
    { key: "referral", label: "Referral" },
    { key: "social_media", label: "Social Media" },
    { key: "cold_call", label: "Cold Call" },
    { key: "facebook", label: "Facebook" },
    { key: "instagram", label: "Instagram" },
    { key: "linkedin", label: "LinkedIn" },
];

const DEFAULT_PRODUCTS = [
    { key: "general", label: "General Inquiry" },
];

// ─── Get all organizations with stats (superAdmin) ──────────────────────────
export async function getOrganizations() {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) return [];

    try {
        await dbConnect();
        const orgs = await Organization.find().sort({ createdAt: -1 }).lean();

        const orgIds = orgs.map((o: any) => o._id);
        const [userCounts, leadCounts, customerCounts] = await Promise.all([
            User.aggregate([
                { $match: { orgId: { $in: orgIds }, active: true } },
                { $group: { _id: "$orgId", count: { $sum: 1 } } },
            ]),
            Lead.aggregate([
                { $match: { orgId: { $in: orgIds }, deletedAt: null } },
                { $group: { _id: "$orgId", count: { $sum: 1 } } },
            ]),
            Lead.aggregate([
                { $match: { orgId: { $in: orgIds }, deletedAt: null, status: { $regex: /customer|won/i } } },
                { $group: { _id: "$orgId", count: { $sum: 1 } } },
            ]),
        ]);

        const userMap = Object.fromEntries(userCounts.map((u: any) => [u._id.toString(), u.count]));
        const leadMap = Object.fromEntries(leadCounts.map((l: any) => [l._id.toString(), l.count]));
        const custMap = Object.fromEntries(customerCounts.map((c: any) => [c._id.toString(), c.count]));

        return orgs.map((o: any) => {
            const leads = leadMap[o._id.toString()] || 0;
            const custs = custMap[o._id.toString()] || 0;
            return {
                _id: o._id.toString(),
                name: o.name,
                slug: o.slug,
                active: o.active,
                description: o.description || "",
                contactEmail: o.contactEmail || "",
                contactPhone: o.contactPhone || "",
                branding: o.branding || { appName: o.name, accentColor: "#8b5cf6", logoUrl: "" },
                theme: o.theme || "violet",
                settings: o.settings ? JSON.parse(JSON.stringify(o.settings)) : null,
                userCount: userMap[o._id.toString()] || 0,
                leadCount: leads,
                customerCount: custs,
                conversionRate: leads > 0 ? Math.round((custs / leads) * 100) : 0,
                createdAt: o.createdAt?.toISOString(),
            };
        });
    } catch (error) {
        console.error("getOrganizations error:", error);
        return [];
    }
}

// ─── Cross-org stats for superAdmin dashboard ───────────────────────────────
export async function getCrossOrgStats() {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) return null;

    try {
        await dbConnect();
        const orgs = await Organization.find({ active: true }).select("name slug branding").lean();
        const orgIds = orgs.map((o: any) => o._id);

        const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);

        const [totalLeads, newLeads, users, customers, recentActivity] = await Promise.all([
            Lead.aggregate([
                { $match: { orgId: { $in: orgIds }, deletedAt: null } },
                { $group: { _id: "$orgId", count: { $sum: 1 } } },
            ]),
            Lead.aggregate([
                { $match: { orgId: { $in: orgIds }, deletedAt: null, createdAt: { $gte: sevenDaysAgo } } },
                { $group: { _id: "$orgId", count: { $sum: 1 } } },
            ]),
            User.aggregate([
                { $match: { orgId: { $in: orgIds }, active: true } },
                { $group: { _id: "$orgId", count: { $sum: 1 } } },
            ]),
            Lead.aggregate([
                { $match: { orgId: { $in: orgIds }, deletedAt: null, status: { $regex: /customer|won/i } } },
                { $group: { _id: "$orgId", count: { $sum: 1 } } },
            ]),
            // Recent activity feed (last 10 actions across all orgs)
            (async () => {
                try {
                    const AuditLog = (await import("@/models/AuditLog")).default;
                    const logs = await AuditLog.find({ orgId: { $in: orgIds } })
                        .sort({ createdAt: -1 })
                        .limit(10)
                        .select("action entityType userName orgId createdAt details")
                        .lean();
                    // Map orgId to orgName for display
                    const orgNameMap = Object.fromEntries(orgs.map((o: any) => [o._id.toString(), o.name]));
                    return logs.map((l: any) => ({
                        action: l.action,
                        entityType: l.entityType,
                        userName: l.userName,
                        orgName: orgNameMap[l.orgId?.toString()] || "Unknown",
                        createdAt: l.createdAt?.toISOString(),
                        details: l.details?.slice?.(0, 60) || "",
                    }));
                } catch { return []; }
            })(),
        ]);

        const mkMap = (arr: any[]) => Object.fromEntries(arr.map((x: any) => [x._id.toString(), x.count]));
        const totalMap = mkMap(totalLeads);
        const newMap = mkMap(newLeads);
        const userMap = mkMap(users);
        const custMap = mkMap(customers);

        const orgStats = orgs.map((o: any) => {
            const id = o._id.toString();
            const total = totalMap[id] || 0;
            const cust = custMap[id] || 0;
            return {
                orgId: id,
                orgName: o.name,
                orgSlug: o.slug,
                orgLogo: o.branding?.logoUrl || "",
                accentColor: o.branding?.accentColor || "#8b5cf6",
                totalLeads: total,
                newLeads7d: newMap[id] || 0,
                users: userMap[id] || 0,
                customers: cust,
                conversionRate: total > 0 ? Math.round((cust / total) * 100) : 0,
            };
        });

        // Top performer = org with highest conversion rate (with min 1 lead)
        const topPerformer = orgStats.filter(o => o.totalLeads > 0).sort((a, b) => b.conversionRate - a.conversionRate)[0] || null;

        return {
            totalOrgs: orgs.length,
            totalLeads: Object.values(totalMap).reduce((s: number, c: any) => s + c, 0),
            totalUsers: Object.values(userMap).reduce((s: number, c: any) => s + c, 0),
            totalCustomers: Object.values(custMap).reduce((s: number, c: any) => s + c, 0),
            orgStats,
            recentActivity,
            topPerformer,
        };
    } catch (error) {
        console.error("getCrossOrgStats error:", error);
        return null;
    }
}

// ─── Create organization with default settings ─────────────────────────────
export async function createOrganization(data: {
    name: string;
    slug: string;
    description?: string;
    contactEmail?: string;
    contactPhone?: string;
    adminName: string;
    adminUsername: string;
    adminPassword: string;
}) {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) {
        return { error: "Only super admins can create organizations." };
    }

    try {
        await dbConnect();

        const existing = await Organization.findOne({ slug: data.slug.toLowerCase() });
        if (existing) return { error: "An organization with this slug already exists." };

        const org = await Organization.create({
            name: data.name,
            slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
            description: data.description || "",
            contactEmail: data.contactEmail || "",
            contactPhone: data.contactPhone || "",
            branding: { appName: data.name, accentColor: "#8b5cf6", logoUrl: "" },
            theme: "violet",
            settings: {
                statuses: DEFAULT_STATUSES,
                sources: DEFAULT_SOURCES,
                products: DEFAULT_PRODUCTS,
                customFields: [],
                customRoles: [],
                goals: { monthlyLeadTarget: 50, monthlyConversionTarget: 10 },
            },
        });

        const passwordHash = await bcrypt.hash(data.adminPassword, 12);
        await User.create({
            orgId: org._id,
            name: data.adminName,
            username: data.adminUsername.toLowerCase(),
            passwordHash,
            role: USER_ROLES.ADMIN,
            isSuperAdmin: false,
            active: true,
        });

        revalidatePath("/settings");
        return { success: true, orgId: org._id.toString() };
    } catch (error: any) {
        console.error("createOrganization error:", error);
        return { error: error.message || "Failed to create organization." };
    }
}

// ─── Update organization details ────────────────────────────────────────────
export async function updateOrganization(
    orgId: string,
    data: {
        name?: string;
        slug?: string;
        description?: string;
        contactEmail?: string;
        contactPhone?: string;
        active?: boolean;
        branding?: { appName?: string; accentColor?: string; logoUrl?: string };
        theme?: "violet" | "ocean" | "emerald";
    }
) {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) {
        return { error: "Only super admins can update organizations." };
    }

    try {
        await dbConnect();
        const org = await Organization.findById(orgId);
        if (!org) return { error: "Organization not found." };

        if (data.name) org.name = data.name;
        if (data.slug) org.slug = data.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-");
        if (data.description !== undefined) org.description = data.description;
        if (data.contactEmail !== undefined) org.contactEmail = data.contactEmail;
        if (data.contactPhone !== undefined) org.contactPhone = data.contactPhone;
        if (data.active !== undefined) org.active = data.active;
        if (data.theme) org.theme = data.theme;
        if (data.branding) {
            if (data.branding.appName !== undefined) org.branding.appName = data.branding.appName;
            if (data.branding.accentColor !== undefined) org.branding.accentColor = data.branding.accentColor;
            if (data.branding.logoUrl !== undefined) org.branding.logoUrl = data.branding.logoUrl;
        }

        await org.save();
        revalidatePath("/settings");
        return { success: true };
    } catch (error: any) {
        console.error("updateOrganization error:", error);
        return { error: error.message || "Failed to update organization." };
    }
}

// ─── Update organization settings (statuses, sources, products, goals) ──────
export async function updateOrganizationSettings(
    orgId: string,
    data: {
        statuses?: { key: string; label: string; color: string }[];
        sources?: { key: string; label: string }[];
        products?: { key: string; label: string }[];
        goals?: { monthlyLeadTarget: number; monthlyConversionTarget: number };
    }
) {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) {
        return { error: "Only super admins can update organization settings." };
    }

    try {
        await dbConnect();
        const org = await Organization.findById(orgId);
        if (!org) return { error: "Organization not found." };

        if (data.statuses) org.settings.statuses = data.statuses as any;
        if (data.sources) org.settings.sources = data.sources as any;
        if (data.products) org.settings.products = data.products as any;
        if (data.goals) org.settings.goals = data.goals as any;

        await org.save();
        revalidatePath("/settings");
        return { success: true };
    } catch (error: any) {
        console.error("updateOrganizationSettings error:", error);
        return { error: error.message || "Failed to update organization settings." };
    }
}

// ─── Get organization users ─────────────────────────────────────────────────
export async function getOrganizationUsers(orgId: string) {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) return [];

    try {
        await dbConnect();
        const users = await User.find({ orgId: new mongoose.Types.ObjectId(orgId) })
            .select("name username role active isSuperAdmin createdAt")
            .sort({ createdAt: -1 })
            .lean();

        return users.map((u: any) => ({
            _id: u._id.toString(),
            name: u.name,
            username: u.username,
            role: u.role,
            active: u.active,
            isSuperAdmin: u.isSuperAdmin || false,
            createdAt: u.createdAt?.toISOString(),
        }));
    } catch (error) {
        console.error("getOrganizationUsers error:", error);
        return [];
    }
}

// ─── Add user to organization ───────────────────────────────────────────────
export async function addUserToOrganization(orgId: string, data: {
    name: string;
    username: string;
    password: string;
    role: string;
}) {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) {
        return { error: "Only super admins can add users to organizations." };
    }

    try {
        await dbConnect();

        const existing = await User.findOne({
            username: data.username.toLowerCase(),
            orgId: new mongoose.Types.ObjectId(orgId),
        });
        if (existing) return { error: "Username already exists in this organization." };

        const passwordHash = await bcrypt.hash(data.password, 12);
        await User.create({
            orgId: new mongoose.Types.ObjectId(orgId),
            name: data.name,
            username: data.username.toLowerCase(),
            passwordHash,
            role: data.role || USER_ROLES.SALES,
            active: true,
        });

        revalidatePath("/settings");
        return { success: true };
    } catch (error: any) {
        console.error("addUserToOrganization error:", error);
        return { error: error.message || "Failed to add user." };
    }
}

// ─── Deactivate organization ────────────────────────────────────────────────
export async function deleteOrganization(orgId: string) {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) {
        return { error: "Only super admins can delete organizations." };
    }

    try {
        await dbConnect();
        await Organization.findByIdAndUpdate(orgId, { active: false });
        revalidatePath("/settings");
        return { success: true };
    } catch (error: any) {
        console.error("deleteOrganization error:", error);
        return { error: error.message || "Failed to delete organization." };
    }
}

// ─── HARD delete organization + all associated data ─────────────────────────
export async function hardDeleteOrganization(orgId: string) {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) {
        return { error: "Only super admins can permanently delete organizations." };
    }

    try {
        await dbConnect();

        // Safety: prevent deleting the caller's own org
        if (session.user.orgId === orgId) {
            return { error: "Cannot delete your own organization." };
        }

        const org = await Organization.findById(orgId);
        if (!org) return { error: "Organization not found." };

        const orgFilter = { orgId: new mongoose.Types.ObjectId(orgId) };
        const db = mongoose.connection.db!;

        // Cascade delete all associated data
        const [users, leads, notes, actions, logs, notifications] = await Promise.all([
            User.deleteMany(orgFilter),
            Lead.deleteMany(orgFilter),
            db.collection("leadnotes").deleteMany(orgFilter),
            db.collection("leadactions").deleteMany(orgFilter),
            db.collection("auditlogs").deleteMany(orgFilter),
            db.collection("notifications").deleteMany(orgFilter),
        ]);

        // Delete settings & whatsapp config (may use orgId as string)
        await Promise.all([
            db.collection("settings").deleteMany({ orgId }),
            db.collection("whatsappconfigs").deleteMany({ orgId }),
        ]);

        // Finally delete the organization itself
        await Organization.findByIdAndDelete(orgId);

        revalidatePath("/settings");
        return {
            success: true,
            summary: {
                users: users.deletedCount,
                leads: leads.deletedCount,
                notes: notes.deletedCount,
                actions: actions.deletedCount,
                logs: logs.deletedCount,
                notifications: notifications.deletedCount,
            },
        };
    } catch (error: any) {
        console.error("hardDeleteOrganization error:", error);
        return { error: error.message || "Failed to permanently delete organization." };
    }
}

// ─── Update a user in an organization ───────────────────────────────────────
export async function updateOrgUser(
    orgId: string,
    userId: string,
    data: { name?: string; role?: string; active?: boolean }
) {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) return { error: "Unauthorized" };

    try {
        await dbConnect();
        const user = await User.findOne({ _id: userId, orgId: new mongoose.Types.ObjectId(orgId) });
        if (!user) return { error: "User not found in this organization." };
        if (user.isSuperAdmin) return { error: "Cannot modify SuperAdmin users." };

        if (data.name !== undefined) user.name = data.name;
        if (data.role !== undefined) user.role = data.role as any;
        if (data.active !== undefined) user.active = data.active;
        await user.save();

        revalidatePath("/settings");
        return { success: true };
    } catch (error: any) {
        console.error("updateOrgUser error:", error);
        return { error: error.message || "Failed to update user." };
    }
}

// ─── Remove a user from an organization ─────────────────────────────────────
export async function removeOrgUser(orgId: string, userId: string) {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) return { error: "Unauthorized" };

    try {
        await dbConnect();
        const user = await User.findOne({ _id: userId, orgId: new mongoose.Types.ObjectId(orgId) });
        if (!user) return { error: "User not found." };
        if (user.isSuperAdmin) return { error: "Cannot remove SuperAdmin users." };

        await User.deleteOne({ _id: userId });
        revalidatePath("/settings");
        return { success: true };
    } catch (error: any) {
        console.error("removeOrgUser error:", error);
        return { error: error.message || "Failed to remove user." };
    }
}

// ─── Suspend / Resume organization ──────────────────────────────────────────
export async function suspendOrganization(orgId: string, suspend: boolean) {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) return { error: "Unauthorized" };

    try {
        await dbConnect();
        // Block/unblock all org users when suspending/resuming
        await Promise.all([
            Organization.findByIdAndUpdate(orgId, { active: !suspend }),
            User.updateMany(
                { orgId: new mongoose.Types.ObjectId(orgId), isSuperAdmin: { $ne: true } },
                { active: !suspend }
            ),
        ]);
        revalidatePath("/settings");
        return { success: true, message: suspend ? "Organization suspended" : "Organization resumed" };
    } catch (error: any) {
        console.error("suspendOrganization error:", error);
        return { error: error.message || "Failed" };
    }
}

// ─── Clone organization (copy settings to new org) ──────────────────────────
export async function cloneOrganization(
    sourceOrgId: string,
    data: { name: string; slug: string; adminName: string; adminUsername: string; adminPassword: string }
) {
    const session = await auth();
    if (!session?.user?.isSuperAdmin) return { error: "Unauthorized" };

    try {
        await dbConnect();
        const source = await Organization.findById(sourceOrgId).lean();
        if (!source) return { error: "Source organization not found." };

        // Check unique slug
        const existing = await Organization.findOne({ slug: data.slug.toLowerCase() });
        if (existing) return { error: "Slug already in use." };

        // Clone with source settings
        const newOrg = await Organization.create({
            name: data.name,
            slug: data.slug.toLowerCase().replace(/[^a-z0-9-]/g, "-"),
            active: true,
            description: `Cloned from ${source.name}`,
            branding: source.branding,
            theme: source.theme,
            settings: source.settings,
        });

        // Create admin user
        const passwordHash = await bcrypt.hash(data.adminPassword, 12);
        await User.create({
            orgId: newOrg._id,
            name: data.adminName || "Admin",
            username: data.adminUsername.toLowerCase(),
            passwordHash,
            role: USER_ROLES.ADMIN,
            active: true,
        });

        revalidatePath("/settings");
        return { success: true, orgId: newOrg._id.toString() };
    } catch (error: any) {
        console.error("cloneOrganization error:", error);
        return { error: error.message || "Clone failed." };
    }
}
