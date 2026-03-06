const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
require("dotenv").config({ path: ".env.local" });

(async () => {
    await mongoose.connect(process.env.MONGODB_URI);
    const hash = await bcrypt.hash("admin123", 10);
    // Update ALL admin users across all orgs
    const r = await mongoose.connection.db.collection("users").updateMany(
        { role: "ADMIN" },
        { $set: { password: hash } }
    );
    console.log("Password reset result:", r.modifiedCount, "admin user(s) updated to 'admin123'");
    await mongoose.disconnect();
})();
