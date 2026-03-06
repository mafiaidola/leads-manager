const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const result = await mongoose.connection.db.collection("organizations").updateOne(
        { slug: "default" },
        { $set: { "branding.logoUrl": "https://leads-manager-iota.vercel.app/smtc-logo-icon.png" } }
    );
    console.log("Updated:", result.modifiedCount, "org(s)");
    
    const org = await mongoose.connection.db.collection("organizations").findOne(
        { slug: "default" },
        { projection: { name: 1, "branding.appName": 1, "branding.logoUrl": 1 } }
    );
    console.log("Current branding:", JSON.stringify(org.branding, null, 2));
    
    await mongoose.disconnect();
})();
