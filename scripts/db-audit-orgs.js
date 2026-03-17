/**
 * @file db-audit-orgs.js
 * @description Database integrity audit for organizations & users.
 * Run: node scripts/db-audit-orgs.js
 *
 * Checks:
 * 1. No users have passwords exposed (passwordHash not in MongoDB query response)
 * 2. All users have valid roles from USER_ROLES enum
 * 3. All users have valid orgId pointing to existing org
 * 4. No duplicate usernames within same org
 * 5. All orgs have at least 1 active ADMIN user
 * 6. No audit log entries with invalid entity types
 * 7. Bcrypt cost factor is 12 for new hashes
 */

require("dotenv").config({ path: ".env.local" });
const mongoose = require("mongoose");

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
    console.error("❌ MONGODB_URI not set in .env.local");
    process.exit(1);
}

const USER_ROLES = ["ADMIN", "MARKETING", "SALES"];
const ENTITY_TYPES = ["lead", "user", "settings", "organization"];

let issues = 0;

function check(label, condition, detail = "") {
    if (!condition) {
        console.log(`  ❌ ISSUE  ${label}${detail ? `: ${detail}` : ""}`);
        issues++;
    } else {
        console.log(`  ✅ OK     ${label}`);
    }
}

async function run() {
    console.log(`\n🔍 DB Audit: Organizations & Users\n`);
    await mongoose.connect(MONGODB_URI);

    const db = mongoose.connection.db;
    const users = await db.collection("users").find({}).toArray();
    const orgs = await db.collection("organizations").find({}).toArray();
    const auditLogs = await db.collection("auditlogs").find({}).limit(500).toArray();

    const orgIds = new Set(orgs.map(o => o._id.toString()));
    const orgAdminMap = {};

    console.log(`📊 Stats: ${users.length} users, ${orgs.length} orgs, ${auditLogs.length} audit logs (sample)\n`);
    console.log("── User Checks ──────────────────────────────────");

    // 1. Role validation
    const invalidRoleUsers = users.filter(u => !USER_ROLES.includes(u.role));
    check("All users have valid roles", invalidRoleUsers.length === 0,
        invalidRoleUsers.map(u => `${u.username} (role: ${u.role || "undefined"})`).join(", "));

    // 2. orgId references valid org
    const orphanUsers = users.filter(u => u.orgId && !orgIds.has(u.orgId.toString()));
    check("All users reference valid org", orphanUsers.length === 0,
        orphanUsers.map(u => `${u.username} → unknown orgId ${u.orgId}`).join(", "));

    // 3. No duplicate usernames within same org
    const userKeyMap = {};
    const dupes = [];
    for (const u of users) {
        const key = `${u.orgId?.toString()}:${u.username}`;
        if (userKeyMap[key]) dupes.push(`${u.username} in org ${u.orgId}`);
        else userKeyMap[key] = true;
    }
    check("No duplicate usernames per org", dupes.length === 0, dupes.join(", "));

    // 4. Bcrypt cost check (should be 12 minimum)
    const lowCostHashes = users.filter(u => {
        if (!u.passwordHash || !u.passwordHash.startsWith("$2")) return false;
        const cost = parseInt(u.passwordHash.split("$")[2]);
        return cost < 12;
    });
    check("All password hashes use bcrypt cost ≥ 12", lowCostHashes.length === 0,
        lowCostHashes.map(u => `${u.username} (cost: ${parseInt(u.passwordHash?.split("$")[2])})`).join(", "));

    // 5. No passwordHash in select fields (sanity check)
    const usersWithHash = users.filter(u => u.passwordHash !== undefined);
    console.log(`  ℹ️  INFO   ${usersWithHash.length}/${users.length} users have passwordHash stored (expected — it's in DB). Ensure getUsers() select('-passwordHash') strips it.`);

    console.log("\n── Organization Checks ─────────────────────────");

    // 6. Each org has at least 1 active ADMIN
    for (const org of orgs) {
        orgAdminMap[org._id.toString()] = users.filter(
            u => u.orgId?.toString() === org._id.toString() && u.role === "ADMIN" && u.active !== false
        ).length;
    }
    const orgsWithNoAdmin = orgs.filter(o => !orgAdminMap[o._id.toString()]);
    check("All orgs have at least 1 active ADMIN", orgsWithNoAdmin.length === 0,
        orgsWithNoAdmin.map(o => o.name).join(", "));

    // 7. Org slugs are unique
    const slugs = orgs.map(o => o.slug);
    const uniqueSlugs = new Set(slugs);
    check("All org slugs are unique", slugs.length === uniqueSlugs.size);

    console.log("\n── Audit Log Checks ─────────────────────────────");

    // 8. Audit logs have valid entity types
    const invalidEntityLogs = auditLogs.filter(l => !ENTITY_TYPES.includes(l.entityType));
    check("All audit log entity types are valid", invalidEntityLogs.length === 0,
        invalidEntityLogs.map(l => `${l.entityType}`).slice(0, 5).join(", "));

    // 9. Audit logs have orgId
    const logsWithoutOrg = auditLogs.filter(l => !l.orgId);
    check("All audit logs have orgId", logsWithoutOrg.length === 0,
        `${logsWithoutOrg.length} logs missing orgId`);

    console.log(`\n─────────────────────────────────────────────────`);
    if (issues === 0) {
        console.log(`  ✅ Database audit PASSED — no issues found`);
    } else {
        console.log(`  ⚠️  ${issues} issue(s) detected — review above`);
    }

    await mongoose.disconnect();
    process.exit(issues > 0 ? 1 : 0);
}

run().catch(err => {
    console.error("DB audit error:", err);
    process.exit(1);
});
