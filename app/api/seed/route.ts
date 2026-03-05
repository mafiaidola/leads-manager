import { NextRequest, NextResponse } from "next/server";
/**
 * @route GET /api/seed
 * @description Development-only: seeds the database with a default admin user.
 * Creates org "Default Organization" if it doesn't exist.
 */
import dbConnect from "@/lib/db";
import User from "@/models/User";
import Organization from "@/models/Organization";
import bcryptjs from "bcryptjs";

export async function GET(request: NextRequest) {
    // Security: Only allow seeding in development, or with a secret token in production
    const isDev = process.env.NODE_ENV === "development";
    const seedSecret = process.env.SEED_SECRET?.trim();
    const providedSecret = request.nextUrl.searchParams.get("secret")?.trim();

    if (!isDev && (!seedSecret || providedSecret !== seedSecret)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // ── Promote action: /api/seed?action=promote&username=Mohamed ──
    const action = request.nextUrl.searchParams.get("action");
    if (action === "promote") {
        const username = request.nextUrl.searchParams.get("username");
        if (!username) return NextResponse.json({ error: "Missing ?username=" }, { status: 400 });
        await dbConnect();
        const user = await User.findOne({ username: new RegExp(`^${username}$`, "i") });
        if (!user) return NextResponse.json({ error: `User "${username}" not found` }, { status: 404 });
        user.isSuperAdmin = true;
        await user.save();
        return NextResponse.json({
            message: `✅ "${user.name}" promoted to SuperAdmin. Log out and log back in.`,
            user: { name: user.name, username: user.username, isSuperAdmin: true },
        });
    }

    // ── Reset password: /api/seed?action=reset-password&username=mohamed&password=New123 ──
    if (action === "reset-password") {
        const username = request.nextUrl.searchParams.get("username");
        const newPassword = request.nextUrl.searchParams.get("password");
        if (!username || !newPassword || newPassword.length < 6) {
            return NextResponse.json({ error: "Missing ?username= and ?password= (min 6 chars)" }, { status: 400 });
        }
        await dbConnect();
        const user = await User.findOne({ username: new RegExp(`^${username}$`, "i") });
        if (!user) return NextResponse.json({ error: `User "${username}" not found` }, { status: 404 });
        user.passwordHash = await bcryptjs.hash(newPassword, 10);
        await user.save();
        return NextResponse.json({
            message: `✅ Password reset for "${user.name}" (${user.username}). You can now log in with the new password.`,
        });
    }

    try {
        await dbConnect();

        // Ensure default organization exists
        let org = await Organization.findOne({ slug: "default" });
        if (!org) {
            org = await Organization.create({
                name: "Default Organization",
                slug: "default",
                active: true,
                branding: { appName: "Leads Manager" },
            });
        }

        const adminEmail = "admin@example.com";
        const existingAdmin = await User.findOne({
            $or: [{ email: adminEmail }, { username: "admin" }],
            orgId: org._id,
        });

        if (!existingAdmin) {
            const hashedPassword = await bcryptjs.hash("admin123", 10);
            await User.create({
                name: "Admin User",
                username: "admin",
                email: adminEmail,
                passwordHash: hashedPassword,
                role: "ADMIN",
                active: true,
                orgId: org._id,
                isSuperAdmin: true,
            });
            return NextResponse.json({
                message: `Admin seeded successfully for org "${org.name}" (slug: ${org.slug}). Login with username: admin, password: admin123`,
            });
        }

        return NextResponse.json({ message: "Admin already exists" });
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
    }
}
