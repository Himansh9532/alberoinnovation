import assert from "node:assert/strict";
import test from "node:test";
import { validateResumeText } from "./resume-validation.js";

test("resume validation accepts a structured resume with multiple sections", () => {
  const result = validateResumeText(`Alex Kumar
alex@example.com

Experience
Software Developer at Example
Built and tested applications.

Education
Bachelor of Engineering`);

  assert.deepEqual(result, { valid: true, error: "" });
});

test("resume validation accepts a contactable resume with a work history section", () => {
  const result = validateResumeText(`Priya Sharma
priya@example.com

Work Experience
Data Analyst at Example
Worked as an analyst preparing reports and dashboards for the team.`);

  assert.equal(result.valid, true);
});

test("resume validation rejects an electricity bill even when it contains contact details", () => {
  const result = validateResumeText(`Customer: Alex Kumar
Email: alex@example.com
Consumer Number: 1234567890
Electricity Bill
Bill Period: April
Meter Reading and Units Consumed: 340 kWh
Total Amount Due: 1,500
Please pay before the due date.`);

  assert.equal(result.valid, false);
  assert.match(result.error, /bill, receipt, or another non-resume document/);
});

test("resume validation rejects unrelated documents without resume sections", () => {
  const result = validateResumeText(`Certificate of Completion
This certificate is awarded for completion of the introductory workshop.
Date of issue: 15 April 2026.
This document confirms attendance at the event.`);

  assert.equal(result.valid, false);
  assert.match(result.error, /does not look like a resume/);
});

test("resume validation rejects extracted text that is too short", () => {
  const result = validateResumeText("Experience Education Skills");

  assert.equal(result.valid, false);
  assert.match(result.error, /not contain enough readable text/);
});
