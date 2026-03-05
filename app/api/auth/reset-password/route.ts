import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcrypt from "bcryptjs";

/**
 * POST /api/auth/reset-password
 * Protected by SEED_SECRET — resets a user's password.
 * Body: { username, orgSlug, newPassword, secret }
 */
export async function POST(req: NextRequest) {
    try {
        const { username, orgSlug, newPassword, secret } = await req.json();

        // Require the SEED_SECRET for security
        if (!secret || secret !== process.env.SEED_SECRET) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        if (!username || !newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: "username and newPassword (min 6 chars) required" }, { status: 400 });
        }

        await dbConnect();

        // Find org by slug
        const Organization = (await import("@/models/Organization")).default;
        const org = await Organization.findOne({ slug: orgSlug || "default-organization" });
        if (!org) {
            return NextResponse.json({ error: "Organization not found" }, { status: 404 });
        }

        const user = await User.findOne({ username: username.toLowerCase(), orgId: org._id });
        if (!user) {
            return NextResponse.json({ error: `User "${username}" not found in org "${org.name}"` }, { status: 404 });
        }

        // Reset password
        user.passwordHash = await bcrypt.hash(newPassword, 10);
        await user.save();

        return NextResponse.json({
            success: true,
            message: `Password reset for "${user.name}" (${user.username}) in "${org.name}"`,
        });
    } catch (error: any) {
        console.error("reset-password error:", error);
        return NextResponse.json({ error: error.message || "Internal error" }, { status: 500 });
    }
}
