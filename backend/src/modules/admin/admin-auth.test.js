import assert from "node:assert/strict";
import test from "node:test";
import { createAdminSession, hashAdminPassword, verifyAdminPassword, verifyAdminSession } from "./admin-auth.js";

test("admin passwords are stored as verifiable scrypt hashes", async () => {
  const encodedHash = await hashAdminPassword("a-long-test-admin-password");
  assert.match(encodedHash, /^scrypt\$[a-f0-9]{32}\$[a-f0-9]{128}$/);
  assert.equal(await verifyAdminPassword("a-long-test-admin-password", encodedHash), true);
  assert.equal(await verifyAdminPassword("different-password", encodedHash), false);
});

test("admin session tokens are signed and expire after eight hours", () => {
  const now = Date.UTC(2026, 0, 1);
  const { token, expiresIn } = createAdminSession("operator", "test-session-secret-at-least-32-characters", now);
  assert.equal(expiresIn, 8 * 60 * 60);
  assert.equal(verifyAdminSession(token, "test-session-secret-at-least-32-characters", now), true);
  assert.equal(verifyAdminSession(token, "wrong-session-secret", now), false);
  assert.equal(verifyAdminSession(token, "test-session-secret-at-least-32-characters", now + expiresIn * 1000), false);
});

test("admin password verifier rejects malformed hash configuration", async () => {
  await assert.rejects(verifyAdminPassword("anything", "not-a-scrypt-hash"), {
    code: "ADMIN_NOT_CONFIGURED",
  });
});
