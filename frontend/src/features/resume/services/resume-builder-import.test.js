import assert from "node:assert/strict";
import test from "node:test";
import { parseResumeBuilderText } from "./resume-builder-import.js";

test("imports markdown resume headings, contacts, headline, and section content", () => {
  const result = parseResumeBuilderText(`# HIMANSHU GUPTA
**AI & Machine Learning | Data Science | Data Analytics | Technical Trainer**

Phone: +91 9532696131
Email: [himanshugupta95326@gmail.com](mailto:himanshugupta95326@gmail.com)
LinkedIn: linkedin.com/in/Himanshu
GitHub: github.com/Himansh9532

## PROFESSIONAL SUMMARY
AI and Data Science professional with hands-on experience.

## TECHNICAL SKILLS
**Programming Languages:** Python, SQL

## PROFESSIONAL EXPERIENCE
### CADD Centre Training Services Pvt. Ltd., Jaipur
- Deliver practical training.

## PROFESSIONAL CERTIFICATES
Excel for Business

## CAREER OBJECTIVE
To contribute as an AI/ML Engineer.`);

  assert.equal(result.error, "");
  assert.equal(result.profile.name, "HIMANSHU GUPTA");
  assert.equal(result.profile.headline, "AI & Machine Learning | Data Science | Data Analytics | Technical Trainer");
  assert.equal(result.profile.phone, "+91 9532696131");
  assert.equal(result.profile.email, "himanshugupta95326@gmail.com");
  assert.equal(result.profile.linkedin, "linkedin.com/in/Himanshu");
  assert.equal(result.profile.github, "github.com/Himansh9532");
  assert.equal(result.profile.summary, "AI and Data Science professional with hands-on experience.");
  assert.equal(result.profile.skills, "**Programming Languages:** Python, SQL");
  assert.equal(result.profile.experience, "**CADD Centre Training Services Pvt. Ltd., Jaipur**\n- Deliver practical training.");
  assert.equal(result.profile.certifications, "Excel for Business");
  assert.equal(result.profile["custom:CAREER OBJECTIVE"], "To contribute as an AI/ML Engineer.");
  assert.equal(result.profile.experienceEntries.length, 0);
});

test("maps common heading variations and combines duplicate sections", () => {
  const result = parseResumeBuilderText(`PROFILE
First summary.

PROFESSIONAL SUMMARY
Second summary.

ACADEMIC BACKGROUND
Degree`);

  assert.deepEqual(result.sections.map(({ key }) => key), ["summary", "education"]);
  assert.equal(result.profile.summary, "First summary.\n\nSecond summary.");
  assert.equal(result.profile.education, "Degree");
});

test("recognizes title-case section headings in tailored resume drafts", () => {
  const result = parseResumeBuilderText(`Himanshu Gupta
AI & Machine Learning
Phone: +91 9532696131

Professional Summary
AI and Data Science professional.

Technical Skills
Python, SQL

Work Experience
Technical Trainer`);

  assert.deepEqual(result.sections.map(({ key }) => key), ["summary", "skills", "experience"]);
  assert.equal(result.profile.summary, "AI and Data Science professional.");
  assert.equal(result.profile.skills, "Python, SQL");
  assert.equal(result.profile.experience, "Technical Trainer");
});

test("returns a clear error for empty input", () => {
  assert.equal(parseResumeBuilderText(" \n ").error, "Paste resume text to import.");
});
