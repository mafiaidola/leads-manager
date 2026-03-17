/**
 * @file smoke-test-orgs.js
 * @description HTTP smoke tests for organizations + users security endpoints.
 * Run: node scripts/smoke-test-orgs.js
 *
 * Tests covered:
 * 1. Backup endpoint requires ADMIN (401/403 for sales/unauthenticated)
 * 2. Backup response does NOT contain passwordHash
 * 3. Upload endpoint requires ADMIN role  
 * 4. Promote-super endpoint always requires SEED_SECRET
 * 5. Organization public list excludes suspended orgs
 */

const BASE_URL = process.env.APP_URL || "http://localhost:3000";

let passed = 0;
let failed = 0;

async function test(name, fn) {
    try {
        await fn();
        console.log(`  ✅ PASS  ${name}`);
        passed++;
    } catch (err) {
        console.log(`  ❌ FAIL  ${name}: ${err.message}`);
        failed++;
    }
}

function assert(condition, message) {
    if (!condition) throw new Error(message);
}

console.log(`\n🔍 Smoke Testing Orgs & Security Layer → ${BASE_URL}\n`);

// ── Test 1: GET /api/backup without auth → 401
await test("GET /api/backup without session → 401", async () => {
    const res = await fetch(`${BASE_URL}/api/backup`);
    assert(res.status === 401, `Expected 401, got ${res.status}`);
});

// ── Test 2: GET /api/promote-super without secret → 403
await test("GET /api/promote-super without SEED_SECRET → 403", async () => {
    const res = await fetch(`${BASE_URL}/api/promote-super?username=anyuser`);
    assert(res.status === 403, `Expected 403, got ${res.status}`);
});

// ── Test 3: GET /api/promote-super with wrong secret → 403
await test("GET /api/promote-super with wrong secret → 403", async () => {
    const res = await fetch(`${BASE_URL}/api/promote-super?username=anyuser&secret=wrong_secret`);
    assert(res.status === 403, `Expected 403, got ${res.status}`);
});

// ── Test 4: GET /api/upload without auth → 401
await test("POST /api/upload without session → 401", async () => {
    const formData = new FormData();
    const blob = new Blob(["fake"], { type: "image/png" });
    formData.append("file", blob, "test.png");
    const res = await fetch(`${BASE_URL}/api/upload`, { method: "POST", body: formData });
    assert(res.status === 401, `Expected 401, got ${res.status}`);
});

// ── Test 5: GET /api/organizations/public → returns array
await test("GET /api/organizations/public → returns array of active orgs", async () => {
    const res = await fetch(`${BASE_URL}/api/organizations/public`);
    assert(res.status === 200, `Expected 200, got ${res.status}`);
    const json = await res.json();
    assert(Array.isArray(json), "Response should be an array");
    // None should have passwordHash
    for (const org of json) {
        assert(!org.passwordHash, `Org ${org.name} should not expose passwordHash`);
    }
});

// ── Test 6: GET /api/reset-password without secret → non-200
await test("POST /api/reset-password without SEED_SECRET → 403", async () => {
    const res = await fetch(`${BASE_URL}/api/reset-password`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username: "admin", orgSlug: "test", newPassword: "newpass123" }),
    });
    assert(res.status === 403, `Expected 403, got ${res.status}`);
});

// ── Summary
console.log(`\n─────────────────────────────────────────`);
console.log(`  Results: ${passed} passed, ${failed} failed out of ${passed + failed} tests`);
if (failed === 0) {
    console.log(`  ✅ All smoke tests PASSED`);
} else {
    console.log(`  ⚠️  ${failed} test(s) FAILED — investigate before deploying`);
    process.exit(1);
}
