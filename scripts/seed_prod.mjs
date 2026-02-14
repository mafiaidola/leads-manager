import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

        // Use Mongoose connection to insert directly since we have issues with model imports
        const UserSchema = new mongoose.Schema({
            name: String,
            email: String,
            passwordHash: String,
            role: String,
            active: { type: Boolean, default: true }
        }, { timestamps: true });

        const User = mongoose.models.User || mongoose.model("User", UserSchema);

        const adminEmail = "admin@example.com";
        const existingAdmin = await User.findOne({ email: adminEmail });

        if (!existingAdmin) {
            const hashedPassword = await bcrypt.hash("admin123", 10);
            await User.create({
                name: "Admin User",
                email: adminEmail,
                passwordHash: hashedPassword,
                role: "ADMIN"
            });
            console.log("Admin created");
        } else {
            console.log("Admin already exists");
        }

        const salesEmail = "sales1@example.com";
        const existingSales = await User.findOne({ email: salesEmail });
        if (!existingSales) {
            const hashedPassword = await bcrypt.hash("sales123", 10);
            await User.create({
                name: "Sales User 1",
                email: salesEmail,
                passwordHash: hashedPassword,
                role: "SALES"
            });
            console.log("Sales user created");
        }

        console.log("Seeding finished");
        process.exit(0);
    } catch (error) {
        console.error("Seeding failed", error);
        process.exit(1);
    }
}

seed();
