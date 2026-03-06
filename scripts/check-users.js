const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    
    // Check all orgs
    const orgs = await mongoose.connection.db.collection("organizations").find({}).toArray();
    console.log(`Organizations (${orgs.length}):`);
    for (const o of orgs) {
        console.log(`  - ${o.name} | slug: ${o.slug} | _id: ${o._id}`);
    }
    
    // Check all users with their org mapping
    const users = await mongoose.connection.db.collection("users").find({}).toArray();
    console.log(`\nUsers (${users.length}):`);
    for (const u of users) {
        const org = orgs.find(o => o._id.toString() === u.orgId?.toString());
        console.log(`  - username: "${u.username}" | name: ${u.name} | role: ${u.role} | superAdmin: ${u.isSuperAdmin} | org: ${org?.name || 'UNKNOWN'} (${u.orgId})`);
    }
    
    // Fix the user with undefined username
    const noUsername = await mongoose.connection.db.collection("users").find({ username: { $exists: false } }).toArray();
    if (noUsername.length > 0) {
        console.log(`\n⚠️  Found ${noUsername.length} user(s) with missing username!`);
    }
    const nullUsername = await mongoose.connection.db.collection("users").find({ username: null }).toArray();
    if (nullUsername.length > 0) {
        console.log(`⚠️  Found ${nullUsername.length} user(s) with null username!`);
    }
    
    await mongoose.disconnect();
})();
