import assert from "node:assert/strict";
import test from "node:test";
import { validateGeneratedResult, validateResumeAssistantPayload } from "./resume-assistant-api.js";

const resumeText = `A detailed candidate resume

Experience
Developed Python projects and completed data analysis for measurable work outcomes.

Skills
Python, data analysis, and project management`;

test("resume AI validates supported actions and requires readable resume text", () => {
  assert.equal(validateResumeAssistantPayload({ action: "analyze", resumeText }), "");
  assert.match(validateResumeAssistantPayload({ action: "unknown", resumeText }), /valid resume AI task/);
  assert.match(validateResumeAssistantPayload({ action: "analyze", resumeText: "too short" }), /at least 80 readable characters/);
});

test("resume AI rejects an electricity bill even when it contains enough readable text", () => {
  const utilityBill = `Customer: Alex Kumar
Email: alex@example.com
Consumer Number: 1234567890
Electricity Bill
Bill Period: April
Meter Reading and Units Consumed: 340 kWh
Total Amount Due: 1,500
Please pay before the due date.`;
  assert.match(
    validateResumeAssistantPayload({ action: "analyze", resumeText: utilityBill }),
    /bill, receipt, or another non-resume document/,
  );
});

test("job matching validates bounded candidate listings", () => {
  const payload = {
    action: "match-jobs",
    resumeText,
    jobs: [{
      id: "job-0",
      title: "Data Analyst",
      company: "Example Co",
      location: "Remote",
      description: "Analyze datasets and communicate findings.",
      tags: ["SQL"],
      remote: true,
    }],
  };
  assert.equal(validateResumeAssistantPayload(payload), "");
  assert.match(validateResumeAssistantPayload({ ...payload, jobs: [{ ...payload.jobs[0], id: "external-id" }] }), /job listings are invalid/);
});

test("AI job results cannot refer to listings that were not supplied", () => {
  const payload = {
    action: "match-jobs",
    resumeText,
    jobs: [{ id: "job-0" }],
  };
  assert.equal(validateGeneratedResult("match-jobs", {
    matches: [{ jobId: "job-0", score: 72, reasons: ["Uses skills found in the resume."], considerations: [] }],
  }, payload), "");
  assert.match(validateGeneratedResult("match-jobs", {
    matches: [{ jobId: "job-1", score: 72, reasons: ["Untrusted listing."], considerations: [] }],
  }, payload), /invalid job match list/);
});

test("AI skill-gap results must use only supplied role skills", () => {
  const payload = { requiredSkills: ["Python", "SQL"] };
  assert.equal(validateGeneratedResult("skill-gaps", {
    summary: "The resume shows evidence for one of the listed skills.",
    evidenced: [{ skill: "Python", evidence: "Built data tools in Python." }],
    gaps: [{ skill: "SQL", nextStep: "Add a verified project using SQL." }],
    questions: ["Where have you used these skills?", "What results can you verify?", "Which project best demonstrates your work?"],
  }, payload), "");
  assert.match(validateGeneratedResult("skill-gaps", {
    summary: "The resume shows evidence for one of the listed skills.",
    evidenced: [{ skill: "Leadership", evidence: "Led a team." }],
    gaps: [],
    questions: ["Question one", "Question two", "Question three"],
  }, payload), /incomplete target-role skill analysis/);
});

test("resume AI text validation ignores surrounding whitespace when enforcing length limits", () => {
  const paddedResume = `   ${resumeText}  `;
  assert.equal(validateResumeAssistantPayload({ action: "analyze", resumeText: paddedResume }), "");
  assert.equal(validateResumeAssistantPayload({
    action: "tailor",
    resumeText: paddedResume,
    jobDescription: `   ${"x".repeat(40)}   `,
    targetRole: "  Data Analyst  ",
  }), "");
});

test("AI resume review validates evidence and action structure", () => {
  const result = {
    summary: "The resume has relevant project evidence and can improve its focus.",
    strengths: [1, 2, 3].map((number) => ({ point: `Strength ${number} is clearly stated.`, evidence: `Source phrase ${number}` })),
    improvements: [1, 2, 3].map((number) => ({
      point: `Improvement ${number} could be clearer.`,
      suggestion: `Clarify the scope for item ${number}.`,
      evidence: `Source phrase ${number}`,
    })),
  };
  assert.equal(validateGeneratedResult("analyze", result, {}), "");
  assert.match(validateGeneratedResult("analyze", { ...result, strengths: [] }, {}), /incomplete resume review/);
});
