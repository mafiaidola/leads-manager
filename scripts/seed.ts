import dotenv from "dotenv";
import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import User, { USER_ROLES } from "../models/User";
import Settings from "../models/Settings";
import path from "path";

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("Please define the MONGODB_URI environment variable inside .env.local");
    process.exit(1);
}

const DEFAULT_STATUSES = [
    { key: "interesting", label: "Interesting", color: "blue" },
    { key: "not_interested", label: "Not Interested", color: "red" },
    { key: "no_answer", label: "No Answer", color: "orange" },
    { key: "registered", label: "Registered", color: "green" },
    { key: "price_is_high", label: "Price is High", color: "yellow" },
    { key: "medium_50", label: "Medium 50%", color: "purple" },
    { key: "close_number", label: "Close Number", color: "indigo" },
    { key: "block", label: "Block", color: "black" },
    { key: "follow_up", label: "Follow Up", color: "cyan" },
    { key: "customer", label: "Customer", color: "emerald" },
    { key: "lost_lead", label: "Lost Lead", color: "slate" },
];

const DEFAULT_SOURCES = [
    { key: "instagram", label: "Instagram" },
    { key: "facebook", label: "Facebook" },
    { key: "google", label: "Google Ads" },
    { key: "referral", label: "Referral" },
    { key: "website", label: "Website" },
];

const DEFAULT_PRODUCTS = [
    { key: "real_estate_basic", label: "Real Estate Basic" },
    { key: "real_estate_premium", label: "Real Estate Premium" },
    { key: "consulting", label: "Consulting" },
];

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI!);
        console.log("Connected to MongoDB for seeding");

        // 1. Seed Settings
        const settingsCount = await Settings.countDocuments();
        if (settingsCount === 0) {
            console.log("Seeding Settings...");
            await Settings.create({
                statuses: DEFAULT_STATUSES,
                sources: DEFAULT_SOURCES,
                products: DEFAULT_PRODUCTS,
            });
            console.log("Settings seeded.");
        } else {
            console.log("Settings already exist, skipping.");
        }

        // 2. Seed Users
        const adminEmail = "admin@example.com";
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (!existingAdmin) {
            console.log("Creating Admin user...");
            const hashedPassword = await bcrypt.hash("admin123", 10);
            await User.create({
                name: "Admin User",
                email: adminEmail,
                passwordHash: hashedPassword,
                role: USER_ROLES.ADMIN,
                active: true,
            });
            console.log(`Admin created: ${adminEmail} / admin123`);
        } else {
            console.log("Admin user already exists.");
        }

        const salesEmails = ["sales1@example.com", "sales2@example.com"];
        for (const email of salesEmails) {
            const existingSales = await User.findOne({ email });
            if (!existingSales) {
                console.log(`Creating Sales user ${email}...`);
                const hashedPassword = await bcrypt.hash("sales123", 10);
                await User.create({
                    name: `Sales User ${email.split("@")[0].replace("sales", "")}`,
                    email: email,
                    passwordHash: hashedPassword,
                    role: USER_ROLES.SALES,
                    active: true,
                });
                console.log(`Sales user created: ${email} / sales123`);
            }
        }

        console.log("Seeding complete.");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed:", error);
        process.exit(1);
    }
}

seed();
