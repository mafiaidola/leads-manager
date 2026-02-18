import { NextResponse } from "next/server";
import dbConnect from "@/lib/db";
import User from "@/models/User";

// One-time migration: generate usernames from existing email addresses
// DELETE this route after running it once
export async function GET() {
    try {
        await dbConnect();
        const users = await User.find({ $or: [{ username: { $exists: false } }, { username: "" }, { username: null }] });

        if (users.length === 0) {
            return NextResponse.json({ message: "No users need migration", migrated: 0 });
        }

        let migrated = 0;
        const results: string[] = [];

        for (const user of users) {
            // Generate username from email prefix, fallback to name
            let baseUsername = "";
            if (user.email) {
                baseUsername = user.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_.-]/g, "");
            } else {
                baseUsername = user.name.toLowerCase().replace(/\s+/g, ".").replace(/[^a-z0-9_.-]/g, "");
            }

            // Ensure uniqueness
            let username = baseUsername;
            let counter = 1;
            while (await User.findOne({ username, _id: { $ne: user._id } })) {
                username = `${baseUsername}${counter}`;
                counter++;
            }

            user.username = username;
            await user.save();
            migrated++;
            results.push(`${user.name}: ${user.email || "no email"} → @${username}`);
        }

        return NextResponse.json({ message: "Migration complete", migrated, results });
    } catch (error) {
        console.error("Migration error:", error);
        return NextResponse.json({ message: "Migration failed", error: String(error) }, { status: 500 });
    }
}
