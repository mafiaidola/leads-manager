const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const path = require("path");

dotenv.config({ path: path.resolve(__dirname, "../.env.local") });

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
    console.error("MONGODB_URI not found");
    process.exit(1);
}

async function seed() {
    try {
        await mongoose.connect(MONGODB_URI);
        console.log("Connected to MongoDB");

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
