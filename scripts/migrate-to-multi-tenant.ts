/**
 * Migration Script: Migrate existing data to multi-tenant structure.
 * 
 * Usage: npx ts-node --compiler-options '{"module":"commonjs"}' scripts/migrate-to-multi-tenant.ts
 * Or:    npx tsx scripts/migrate-to-multi-tenant.ts
 * 
 * This script:
 * 1. Creates a default organization with all existing settings
 * 2. Assigns orgId to all existing Users, Leads, LeadNotes, LeadActions, AuditLogs, Notifications, WhatsAppConfigs
 * 3. Makes the first admin user a superAdmin
 */

import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI || process.env.DATABASE_URL;

if (!MONGODB_URI) {
    console.error("❌ Missing MONGODB_URI or DATABASE_URL in .env.local");
    process.exit(1);
}

async function migrate() {
    console.log("🔄 Connecting to database...");
    await mongoose.connect(MONGODB_URI!);
    const db = mongoose.connection.db!;

    // Step 1: Check if any organizations already exist
    const existingOrgs = await db.collection("organizations").countDocuments();
    if (existingOrgs > 0) {
        console.log("⚠️  Organizations already exist. Skipping migration.");
        console.log(`   Found ${existingOrgs} organization(s).`);
        await mongoose.disconnect();
        return;
    }

    // Step 2: Load existing settings (if any)
    const existingSettings = await db.collection("settings").findOne();

    // Step 3: Create default organization
    const defaultOrg = {
        name: "Default Organization",
        slug: "default",
        active: true,
        branding: {
            appName: existingSettings?.branding?.appName || "Leads Mgr",
            accentColor: existingSettings?.branding?.accentColor || "#8b5cf6",
            logoUrl: existingSettings?.branding?.logoUrl || "",
        },
        theme: existingSettings?.theme || "violet",
        settings: {
            statuses: existingSettings?.statuses || [
                { label: "Interesting", value: "interesting", color: "#8b5cf6" },
                { label: "Contacted", value: "contacted", color: "#3b82f6" },
                { label: "Qualified", value: "qualified", color: "#f59e0b" },
                { label: "Lost", value: "lost", color: "#ef4444" },
                { label: "Won", value: "won", color: "#22c55e" },
            ],
            sources: existingSettings?.sources || [
                { label: "Website", value: "website" },
                { label: "Referral", value: "referral" },
                { label: "Social Media", value: "social" },
                { label: "Cold Call", value: "cold_call" },
                { label: "Other", value: "other" },
            ],
            products: existingSettings?.products || [],
            customFields: existingSettings?.customFields || [],
            customRoles: existingSettings?.customRoles || [],
            goals: existingSettings?.goals || { monthlyLeadTarget: 50, monthlyConversionTarget: 10 },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
    };

    const result = await db.collection("organizations").insertOne(defaultOrg);
    const orgId = result.insertedId;
    console.log(`✅ Created default organization: ${orgId}`);

    // Step 4: Update all collections with orgId
    const collections = [
        "users",
        "leads",
        "leadnotes",
        "leadactions",
        "auditlogs",
        "notifications",
        "whatsappconfigs",
    ];

    for (const collName of collections) {
        try {
            const updateResult = await db.collection(collName).updateMany(
                { orgId: { $exists: false } },
                { $set: { orgId } }
            );
            console.log(`✅ Updated ${collName}: ${updateResult.modifiedCount} documents`);
        } catch (err) {
            console.log(`⚠️  Collection ${collName} may not exist yet, skipping.`);
        }
    }

    // Step 5: Make the first admin user a superAdmin
    const firstAdmin = await db.collection("users").findOne({ role: "ADMIN" });
    if (firstAdmin) {
        await db.collection("users").updateOne(
            { _id: firstAdmin._id },
            { $set: { isSuperAdmin: true } }
        );
        console.log(`✅ Made ${firstAdmin.name || firstAdmin.username} a superAdmin`);
    }

    console.log("\n🎉 Migration complete!");
    console.log(`   Organization ID: ${orgId}`);
    console.log(`   Organization Slug: default`);
    console.log("   You can now select 'Default Organization' at login.");

    await mongoose.disconnect();
}

migrate().catch((err) => {
    console.error("❌ Migration failed:", err);
    process.exit(1);
});
