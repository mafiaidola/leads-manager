import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

const UserSchema = new mongoose.Schema({
    name: { type: String, required: true },
    username: { type: String, required: true, unique: true, lowercase: true, trim: true },
    email: { type: String },
    passwordHash: { type: String, required: true },
    role: { type: String, enum: ["ADMIN", "SALES", "MARKETING"], default: "SALES" },
    active: { type: Boolean, default: true }
}, { timestamps: true });

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("✅ Connected to MongoDB");

        const User = mongoose.models.User || mongoose.model("User", UserSchema);

        const users = [
            { name: "Admin User", username: "admin", password: "admin123", role: "ADMIN" },
            { name: "Sales User 1", username: "sales1", password: "sales123", role: "SALES" },
            { name: "Marketing", username: "marketing", password: "market123", role: "MARKETING" },
        ];

        for (const u of users) {
            const existing = await User.findOne({ username: u.username });
            if (!existing) {
                const passwordHash = await bcrypt.hash(u.password, 10);
                await User.create({
                    name: u.name,
                    username: u.username,
                    email: `${u.username}@leads.local`,
                    passwordHash,
                    role: u.role,
                    active: true,
                });
                console.log(`✅ Created: ${u.username} (${u.role})`);
            } else {
                // Update password in case it changed
                const passwordHash = await bcrypt.hash(u.password, 10);
                existing.passwordHash = passwordHash;
                existing.name = u.name;
                existing.role = u.role;
                existing.active = true;
                await existing.save();
                console.log(`🔄 Updated: ${u.username} (${u.role})`);
            }
        }

        console.log("\n📋 Login credentials:");
        console.log("  Admin:     username=admin      password=admin123");
        console.log("  Sales:     username=sales1     password=sales123");
        console.log("  Marketing: username=marketing  password=market123");

        process.exit(0);
    } catch (error) {
        console.error("❌ Seeding failed", error);
        process.exit(1);
    }
}

seed();
