const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
require("dotenv").config({ path: ".env.local" });

(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    
    const hash = await bcrypt.hash("admin123", 12);
    
    // Fix: set passwordHash (the correct model field), not "password"  
    const result = await mongoose.connection.db.collection("users").updateMany(
        { $or: [{ role: "ADMIN" }, { isSuperAdmin: true }, { username: "admin" }] },
        { $set: { passwordHash: hash } }
    );
    console.log(`Reset passwordHash for ${result.modifiedCount} admin user(s)`);
    
    // Verify it works
    const admins = await mongoose.connection.db.collection("users").find({ username: "admin" }).toArray();
    for (const a of admins) {
        const match = await bcrypt.compare("admin123", a.passwordHash);
        console.log(`  user "${a.username}" passwordHash matches "admin123": ${match}`);
    }
    
    // Also clean up the corrupted user with username "undefined"
    const deleted = await mongoose.connection.db.collection("users").deleteOne({ username: "undefined" });
    console.log(`Deleted ${deleted.deletedCount} corrupted user(s) with username "undefined"`);
    
    await mongoose.disconnect();
})();
