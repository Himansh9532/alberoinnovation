import assert from "node:assert/strict";
import test from "node:test";
import { handleAdminLogin, handleAdminStats } from "./admin-api.js";

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(body) {
      this.body = body;
    },
  };
}

test("admin statistics endpoint rejects requests without an admin session", async () => {
  const original = {
    username: process.env.ADMIN_USERNAME,
    passwordHash: process.env.ADMIN_PASSWORD_HASH,
    sessionSecret: process.env.ADMIN_SESSION_SECRET,
  };
  process.env.ADMIN_USERNAME = "test-admin";
  process.env.ADMIN_PASSWORD_HASH = "scrypt$0123456789abcdef0123456789abcdef$" + "a".repeat(128);
  process.env.ADMIN_SESSION_SECRET = "test-admin-session-secret-long-enough";
  try {
    const response = createResponse();
    await handleAdminStats({ method: "GET", headers: {} }, response);
    assert.equal(response.statusCode, 401);
    assert.equal(JSON.parse(response.body).code, "ADMIN_AUTH_REQUIRED");
    assert.equal(response.headers["Cache-Control"], "no-store");
  } finally {
    if (original.username === undefined) delete process.env.ADMIN_USERNAME;
    else process.env.ADMIN_USERNAME = original.username;
    if (original.passwordHash === undefined) delete process.env.ADMIN_PASSWORD_HASH;
    else process.env.ADMIN_PASSWORD_HASH = original.passwordHash;
    if (original.sessionSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = original.sessionSecret;
  }
});

test("admin login attempts expire after the advertised 15-minute window", async () => {
  const original = {
    username: process.env.ADMIN_USERNAME,
    passwordHash: process.env.ADMIN_PASSWORD_HASH,
    sessionSecret: process.env.ADMIN_SESSION_SECRET,
    now: Date.now,
  };
  process.env.ADMIN_USERNAME = "test-admin";
  process.env.ADMIN_PASSWORD_HASH = "configured";
  process.env.ADMIN_SESSION_SECRET = "test-admin-session-secret-long-enough";
  let now = Date.UTC(2026, 0, 1);
  Date.now = () => now;

  try {
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = createResponse();
      await handleAdminLogin({
        method: "POST",
        headers: {},
        socket: { remoteAddress: "admin-window-test" },
        body: { username: "wrong", password: "" },
      }, response);
      assert.equal(response.statusCode, 401);
    }

    now += 15 * 60 * 1000;
    for (let attempt = 0; attempt < 3; attempt += 1) {
      const response = createResponse();
      await handleAdminLogin({
        method: "POST",
        headers: {},
        socket: { remoteAddress: "admin-window-test" },
        body: { username: "wrong", password: "" },
      }, response);
      assert.equal(response.statusCode, 401);
    }
  } finally {
    Date.now = original.now;
    if (original.username === undefined) delete process.env.ADMIN_USERNAME;
    else process.env.ADMIN_USERNAME = original.username;
    if (original.passwordHash === undefined) delete process.env.ADMIN_PASSWORD_HASH;
    else process.env.ADMIN_PASSWORD_HASH = original.passwordHash;
    if (original.sessionSecret === undefined) delete process.env.ADMIN_SESSION_SECRET;
    else process.env.ADMIN_SESSION_SECRET = original.sessionSecret;
  }
});
