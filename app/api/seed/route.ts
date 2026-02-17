import { NextRequest, NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcryptjs from "bcryptjs";

export async function GET(request: NextRequest) {
    // Security: Only allow seeding in development, or with a secret token in production
    const isDev = process.env.NODE_ENV === "development";
    const seedSecret = process.env.SEED_SECRET;
    const providedSecret = request.nextUrl.searchParams.get("secret");

    if (!isDev && (!seedSecret || providedSecret !== seedSecret)) {
        return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    try {
        await dbConnect();

        const adminEmail = "admin@example.com";
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (!existingAdmin) {
            const hashedPassword = await bcryptjs.hash("admin123", 10);
            await User.create({
                name: "Admin User",
                email: adminEmail,
                passwordHash: hashedPassword,
                role: "ADMIN",
                active: true
            });
            return NextResponse.json({ message: "Admin seeded successfully" });
        }

        return NextResponse.json({ message: "Admin already exists" });
    } catch (error) {
        if (error instanceof Error) {
            return NextResponse.json({ error: error.message }, { status: 500 });
        }
        return NextResponse.json({ error: "An unknown error occurred" }, { status: 500 });
    }
}
