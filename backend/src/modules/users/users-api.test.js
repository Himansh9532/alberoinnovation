import assert from "node:assert/strict";
import test from "node:test";
import { handleSaveUserProfile } from "./users-api.js";

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

test("user profile endpoint requires a Firebase ID token", async () => {
  const response = createResponse();
  await handleSaveUserProfile({ method: "POST", headers: {} }, response);

  assert.equal(response.statusCode, 401);
  assert.deepEqual(JSON.parse(response.body), {
    error: "Sign in with your SkillAI account to use plans and AI practice.",
    code: "AUTH_REQUIRED",
  });
});

test("user profile endpoint only accepts POST requests", async () => {
  const response = createResponse();
  await handleSaveUserProfile({ method: "GET", headers: {} }, response);

  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, "POST");
  assert.deepEqual(JSON.parse(response.body), { error: "Use POST to save your user profile." });
});
