import assert from "node:assert/strict";
import test from "node:test";
import { apiRoutes } from "./routes.js";

test("API route registration is shared and includes every supported endpoint", () => {
  assert.deepEqual([...apiRoutes.keys()].sort(), [
    "/api/admin/login",
    "/api/admin/stats",
    "/api/billing/order",
    "/api/billing/usage",
    "/api/billing/verify-payment",
    "/api/contact",
    "/api/generate-interview",
    "/api/jobs/india",
    "/api/research-assistant",
    "/api/resume-assistant",
    "/api/skill-assessment",
    "/api/users/profile",
    "/api/users/resume",
  ]);
  for (const handler of apiRoutes.values()) assert.equal(typeof handler, "function");
});
