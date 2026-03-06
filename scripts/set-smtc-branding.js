const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Update Default Organization's branding to SMTC Group
    const result = await mongoose.connection.db.collection("organizations").updateOne(
        { slug: "default" },
        { $set: { "branding.appName": "SMTC Group", name: "SMTC Group" } }
    );
    
    if (result.matchedCount === 0) {
        // If no "default" slug, update the first org
        const firstOrg = await mongoose.connection.db.collection("organizations").findOne({}, { sort: { createdAt: 1 } });
        if (firstOrg) {
            await mongoose.connection.db.collection("organizations").updateOne(
                { _id: firstOrg._id },
                { $set: { "branding.appName": "SMTC Group", name: "SMTC Group" } }
            );
            console.log(`Updated "${firstOrg.name}" to "SMTC Group" (first org)`);
        } else {
            console.log("No organizations found!");
        }
    } else {
        console.log('Updated default org to "SMTC Group"');
    }

    // Show all orgs for confirmation
    const orgs = await mongoose.connection.db.collection("organizations")
        .find({}, { projection: { name: 1, slug: 1, "branding.appName": 1, "branding.logoUrl": 1 } })
        .toArray();
    console.log("\nAll organizations:");
    orgs.forEach(o => console.log(`  - ${o.name} (slug: ${o.slug}, appName: ${o.branding?.appName}, logo: ${o.branding?.logoUrl || "none"})`));

    await mongoose.disconnect();
})();
