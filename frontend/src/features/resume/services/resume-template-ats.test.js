import assert from "node:assert/strict";
import test from "node:test";
import { isAtsFriendlyTemplate } from "./resume-template-ats.js";

test("single-column templates without headshots or decorative graphics are ATS-friendly", () => {
  assert.equal(isAtsFriendlyTemplate({ columns: 1, headshot: false, graphics: "None" }), true);
  assert.equal(isAtsFriendlyTemplate({ columns: 1, headshot: false, graphics: "Simple" }), true);
});

test("templates with multiple columns, headshots, or decorative graphics are flagged for review", () => {
  assert.equal(isAtsFriendlyTemplate({ columns: 2, headshot: false, graphics: "None" }), false);
  assert.equal(isAtsFriendlyTemplate({ columns: 1, headshot: true, graphics: "Simple" }), false);
  assert.equal(isAtsFriendlyTemplate({ columns: 1, headshot: false, graphics: "Decorative" }), false);
});
