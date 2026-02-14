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
    role: z.enum([USER_ROLES.ADMIN, USER_ROLES.MARKETING, USER_ROLES.SALES]),
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
        return { message: "User created successfully" };
    } catch (error) {
        console.error("Failed to create user:", error);
        return { message: "Database Error: Failed to create user." };
    }
}

// Keep backward-compatible alias
export const createSalesUser = createUser;

export async function getUsers() {
    const session = await auth();
    if (!session || session.user.role !== USER_ROLES.ADMIN) {
        return [];
    }
    await dbConnect();
    // Return plain objects to avoid serialization issues
    const users = await User.find({}).sort({ createdAt: -1 }).lean();
    return users.map(user => ({
        ...user,
        _id: user._id.toString(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    }));
}

export async function getSalesUsers() {
    const session = await auth();
    if (!session) return [];

    // Marketing and Admin can see sales users for assignment
    if (session.user.role !== USER_ROLES.ADMIN && session.user.role !== USER_ROLES.MARKETING) {
        return [];
    }

    await dbConnect();
    const users = await User.find({ role: USER_ROLES.SALES, active: true }).sort({ name: 1 }).lean();
    return users.map(user => ({
        ...user,
        _id: user._id.toString(),
        createdAt: user.createdAt.toISOString(),
        updatedAt: user.updatedAt.toISOString(),
    }));
}
