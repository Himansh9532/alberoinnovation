import assert from "node:assert/strict";
import test from "node:test";
import { handleUserResume } from "./resume-api.js";

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

test("resume endpoint rejects unauthenticated requests", async () => {
  const response = createResponse();
  await handleUserResume({ method: "GET", headers: {} }, response);

  assert.equal(response.statusCode, 401);
  assert.equal(JSON.parse(response.body).code, "AUTH_REQUIRED");
});

test("resume endpoint only accepts supported methods", async () => {
  const response = createResponse();
  await handleUserResume({ method: "POST", headers: {} }, response);

  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, "GET, PUT, DELETE");
});
