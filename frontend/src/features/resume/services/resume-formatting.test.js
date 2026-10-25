import assert from "node:assert/strict";
import test from "node:test";
import { parseResumeContentLine } from "./resume-formatting.js";

test("bolds skill category labels before their colon", () => {
  assert.deepEqual(parseResumeContentLine("Programming Languages: Python, SQL", "skills"), [
    { text: "Programming Languages:", bold: true },
    { text: " Python, SQL" },
  ]);
});

test("retains explicit markdown emphasis on resume content", () => {
  assert.deepEqual(parseResumeContentLine("**CADD Centre Training Services Pvt. Ltd.**, Jaipur", "experience"), [
    { text: "CADD Centre Training Services Pvt. Ltd.", bold: true },
    { text: ", Jaipur", bold: false },
  ]);
});

test("does not infer skill labels outside the skills section", () => {
  assert.deepEqual(parseResumeContentLine("Led a team: 5 engineers", "experience"), [
    { text: "Led a team: 5 engineers", bold: false },
  ]);
});
