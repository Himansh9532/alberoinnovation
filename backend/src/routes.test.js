import assert from "node:assert/strict";
import test from "node:test";
import { apiRoutes } from "./routes.js";

test("API route registration is shared and includes every supported endpoint", () => {
  assert.deepEqual([...apiRoutes.keys()].sort(), [
    "/api/billing/order",
    "/api/billing/usage",
    "/api/billing/verify-payment",
    "/api/generate-interview",
    "/api/jobs/india",
    "/api/research-assistant",
    "/api/resume-assistant",
    "/api/skill-assessment",
  ]);
  for (const handler of apiRoutes.values()) assert.equal(typeof handler, "function");
});
