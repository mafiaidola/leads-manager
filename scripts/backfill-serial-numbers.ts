/**
 * Backfill Serial Numbers for Existing Leads
 *
 * Run with: npx tsx scripts/backfill-serial-numbers.ts
 *
 * This script:
 * 1. Finds all leads without a serialNumber
 * 2. Assigns sequential serial numbers (starting from the current counter)
 * 3. Also backfills a default countryCode of "971" if missing
 */
import mongoose from "mongoose";
import dotenv from "dotenv";
dotenv.config({ path: ".env.local" });

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not found in .env.local");
    process.exit(1);
}

async function main() {
    console.log("🔌 Connecting to MongoDB...");
    await mongoose.connect(MONGODB_URI!);
    console.log("✅ Connected\n");

    // Import models after connection
    const Lead = (await import("../models/Lead")).default;
    const { getNextSequenceBatch } = await import("../models/Counter");

    // Find leads missing serial numbers, ordered by creation date
    const leadsWithout = await Lead.find({ serialNumber: { $exists: false } })
        .sort({ createdAt: 1 })
        .select("_id name countryCode")
        .lean();

    console.log(`📊 Found ${leadsWithout.length} leads without serial numbers\n`);

    if (leadsWithout.length === 0) {
        console.log("✅ Nothing to backfill. All leads have serial numbers.");
        await mongoose.disconnect();
        return;
    }

    // Allocate a batch of sequence numbers
    const startSeq = await getNextSequenceBatch("lead_serial", leadsWithout.length);
    console.log(`🔢 Allocated serial range: ${startSeq} – ${startSeq + leadsWithout.length - 1}\n`);

    // Bulk update
    const bulkOps = leadsWithout.map((lead: any, idx: number) => ({
        updateOne: {
            filter: { _id: lead._id },
            update: {
                $set: {
                    serialNumber: startSeq + idx,
                    ...(lead.countryCode ? {} : { countryCode: "971" }),
                },
            },
        },
    }));

    const result = await Lead.bulkWrite(bulkOps);
    console.log(`✅ Modified ${result.modifiedCount} leads`);
    console.log(`   Serial numbers assigned: ${startSeq} → ${startSeq + leadsWithout.length - 1}`);

    await mongoose.disconnect();
    console.log("\n🔌 Disconnected. Done!");
}

main().catch((err) => {
    console.error("❌ Error:", err);
    process.exit(1);
});
