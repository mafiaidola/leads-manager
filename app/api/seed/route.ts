import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";
import bcryptjs from "bcryptjs";

export async function GET() {
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
        return NextResponse.json({ error: error.message }, { status: 500 });
    }
}
