"use server";

import { auth } from "@/auth";
import dbConnect from "@/lib/db";
import User, { USER_ROLES } from "@/models/User";
import bcrypt from "bcryptjs";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const CreateUserSchema = z.object({
    name: z.string().min(2),
    email: z.string().email(),
    password: z.string().min(6),
    role: z.string().min(1),
});

export async function createUser(prevState: any, formData: FormData) {
    const session = await auth();
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
        return { message: "Unauthorized" };
    }

    const role = formData.get("role") as string || USER_ROLES.SALES;

    const validatedFields = CreateUserSchema.safeParse({
        name: formData.get("name"),
        email: formData.get("email"),
        password: formData.get("password"),
        role: role,
    });

    if (!validatedFields.success) {
        return { message: "Invalid fields" };
    }

    const { name, email, password, role: validatedRole } = validatedFields.data;

    try {
        await dbConnect();
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return { message: "User already exists" };
        }

        const passwordHash = await bcrypt.hash(password, 10);
        await User.create({
            name,
            email,
            passwordHash,
            role: validatedRole,
            active: true,
        });

        revalidatePath("/settings");
        return { message: "User created successfully", success: true };
    } catch (error) {
        console.error("Failed to create user:", error);
        return { message: "Database Error: Failed to create user." };
    }
}

// Keep backward-compatible alias
export const createSalesUser = createUser;

export async function updateUser(userId: string, data: { name?: string; email?: string; role?: string; active?: boolean }) {
    const session = await auth();
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
        return { message: "Unauthorized" };
    }

    try {
        await dbConnect();
        const user = await User.findById(userId);
        if (!user) return { message: "User not found" };

        if (data.name) user.name = data.name;
        if (data.email) {
            const existing = await User.findOne({ email: data.email, _id: { $ne: userId } });
            if (existing) return { message: "Email already in use" };
            user.email = data.email;
        }
        if (data.role) user.role = data.role as any;
        if (typeof data.active === "boolean") user.active = data.active;

        await user.save();
        revalidatePath("/settings");
        return { message: "User updated successfully", success: true };
    } catch (error) {
        console.error("Failed to update user:", error);
        return { message: "Failed to update user" };
    }
}

export async function deleteUser(userId: string) {
    const session = await auth();
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
        return { message: "Unauthorized" };
    }

    // Prevent self-deletion
    if (session.user.id === userId) {
        return { message: "Cannot delete your own account" };
    }

    try {
        await dbConnect();
        const user = await User.findById(userId);
        if (!user) return { message: "User not found" };

        // Deactivate rather than hard delete
        user.active = false;
        await user.save();

        revalidatePath("/settings");
        return { message: "User deactivated successfully", success: true };
    } catch (error) {
        console.error("Failed to delete user:", error);
        return { message: "Failed to delete user" };
    }
}

export async function changePassword(oldPassword: string, newPassword: string) {
    const session = await auth();
    if (!session) return { message: "Unauthorized" };

    if (newPassword.length < 6) {
        return { message: "Password must be at least 6 characters" };
    }

    try {
        await dbConnect();
        const user = await User.findById(session.user.id);
        if (!user) return { message: "User not found" };

        const isValid = await bcrypt.compare(oldPassword, user.passwordHash);
        if (!isValid) return { message: "Current password is incorrect" };

        user.passwordHash = await bcrypt.hash(newPassword, 10);
        await user.save();

        return { message: "Password changed successfully", success: true };
    } catch (error) {
        console.error("Failed to change password:", error);
        return { message: "Failed to change password" };
    }
}

export async function getUsers() {
    const session = await auth();
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
        return [];
    }
    try {
        await dbConnect();
        const users = await User.find({}).sort({ createdAt: -1 }).lean();
        return users.map(user => ({
            ...user,
            _id: user._id.toString(),
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
        }));
    } catch (error) {
        console.error("getUsers error:", error);
        return [];
    }
}

export async function getSalesUsers() {
    const session = await auth();
    if (!session) return [];

    if (session.user.role !== USER_ROLES.ADMIN && session.user.role !== USER_ROLES.MARKETING) {
        return [];
    }

    try {
        await dbConnect();
        const users = await User.find({ role: USER_ROLES.SALES, active: true }).sort({ name: 1 }).lean();
        return users.map(user => ({
            ...user,
            _id: user._id.toString(),
            createdAt: user.createdAt.toISOString(),
            updatedAt: user.updatedAt.toISOString(),
        }));
    } catch (error) {
        console.error("getSalesUsers error:", error);
        return [];
    }
}
