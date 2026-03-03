

import dbConnect from "@/lib/db";
import User from "@/models/User";
import { NextRequest, NextResponse } from "next/server";

/**
 * One-time route to promote an ADMIN user to superAdmin.
 * GET /api/promote-super?username=Mohamed&secret=SEED_SECRET
 * Only works in dev, or with the SEED_SECRET env variable.
 */
export async function GET(request: NextRequest) {
    const isDev = process.env.NODE_ENV === "development";
    const seedSecret = process.env.SEED_SECRET?.trim();
    const providedSecret = request.nextUrl.searchParams.get("secret")?.trim();
    const username = request.nextUrl.searchParams.get("username");

    if (!isDev && (!seedSecret || providedSecret !== seedSecret)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    if (!username) {
        return NextResponse.json({ error: "Missing ?username= parameter" }, { status: 400 });
    }

    try {
        await dbConnect();
        const user = await User.findOne({ username: new RegExp(`^${username}$`, "i") });
        if (!user) {
            return NextResponse.json({ error: `User "${username}" not found` }, { status: 404 });
        }

        user.isSuperAdmin = true;
        await user.save();

        return NextResponse.json({
            message: `✅ User "${user.name}" (${user.username}) promoted to SuperAdmin. Please log out and log back in for the change to take effect.`,
            user: { name: user.name, username: user.username, role: user.role, isSuperAdmin: true },
        });
    } catch (error: any) {
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
