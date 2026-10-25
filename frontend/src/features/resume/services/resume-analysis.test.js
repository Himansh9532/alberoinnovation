import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import test from "node:test";
import * as pdfjs from "pdfjs-dist/legacy/build/pdf.mjs";
import { validateResumeText } from "../../../../../shared/resume-validation.js";
import {
  analyzeResumeText,
  detectContactDetails,
  detectResumeSections,
  extractPdfResumeText,
} from "./resume-analysis.js";

const actionResume = `Alex Kumar
alex@example.com · +91 98765 43210

Professional Summary
Data professional with experience in analysis and delivery.

Technical Skills:
Python, SQL, reporting, data visualization, machine learning, Excel.

Work Experience
∗ Deliver analytics training for 40 learners.
  across three cohorts each year.
• Conducted workshops for teams.
• Managed an analytics program.
• Guided students through projects.
• Supported 12 learners.
• Trained new team members.
• Delivered dashboards.
• Enhanced model accuracy by 15%.
• Boosted predictive performance by 20%.
• Automated 50% of the ML pipeline, reducing manual errors by 30%.
• Built a classifier and achieved 90% accuracy.

Projects
Built a reporting workflow for a research group.

Professional Certificates
Data Analytics Certificate

Education
Bachelor of Science, graduated in 2020.
`;

test("contact detection finds email and Indian or international phone formats around symbols", () => {
  const contact = detectContactDetails("☎ +91 9532696131 # alex@example.com");
  assert.deepEqual(contact.email.values, ["alex@example.com"]);
  assert.equal(contact.email.found, true);
  assert.equal(contact.phone.found, true);
  assert.match(contact.phone.values.join(" "), /9532696131/);

  const international = detectContactDetails("Contact: +1 (212) 555-0198");
  assert.equal(international.phone.found, true);
  assert.match(international.phone.values.join(" "), /212/);
});

test("section matcher recognizes normalized heading synonyms once and ignores body text", () => {
  const sections = detectResumeSections(`I have experience with databases and technical skills.
PROFESSIONAL SUMMARY:
Work Experience
Technical Skills
Professional Certificates
Research Publications
Academic Background`);
  assert.deepEqual(sections.map(({ section }) => section), [
    "summary",
    "experience",
    "education",
    "skills",
    "certifications",
    "publications",
  ]);
});

test("analysis captures supported bullet verbs, wrapped bullets and measurable evidence", () => {
  const analysis = analyzeResumeText(actionResume, {
    skillCatalog: ["Python", "SQL", "Excel"],
  });
  assert.ok(analysis);
  assert.equal(analysis.contact.phone.found, true);
  assert.equal(analysis.contact.email.found, true);
  assert.deepEqual(analysis.presentSections, ["summary", "experience", "education", "projects", "skills", "certifications"]);
  assert.deepEqual(analysis.actionBullets.slice(0, 3).map(({ verb }) => verb), ["Deliver", "Conducted", "Managed"]);
  assert.ok(analysis.actionBullets.some(({ snippet }) => snippet.includes("across three cohorts each year")));
  for (const expected of ["15", "20", "50", "30", "90"]) {
    assert.ok(analysis.quantifiedClaims.some(({ value }) => value === expected), `Expected measurable result ${expected}`);
  }
  assert.equal(analysis.atsReadiness.score, analysis.atsReadiness.factors.reduce((sum, factor) => sum + factor.score, 0));
  assert.ok(analysis.atsReadiness.score <= 100);
  assert.ok(analysis.atsReadiness.factors.every((factor) => factor.score >= 0 && factor.score <= factor.max));
});

test("measurable-result detection ignores contact numbers and education years", () => {
  const analysis = analyzeResumeText(`Jordan Lee
jordan@example.com
+91 98765 43210
Work Experience
Managed product planning from 2020 to 2022.
Education
Bachelor of Science, 2020.`, { skillCatalog: [] });
  assert.ok(analysis);
  assert.equal(analysis.quantifiedClaims.length, 0);
});

test("unlisted bullet openings are not scored as weak action verbs", () => {
  const oneRecognized = analyzeResumeText(`${actionResume}\n• Collaborated with a cross-functional team.`, { skillCatalog: [] });
  const withUnlisted = analyzeResumeText(`${actionResume}\n• Collaborated with a cross-functional team.\n• Consulted with stakeholders.`, { skillCatalog: [] });
  const scoreOf = (analysis) => analysis.atsReadiness.factors.find((factor) => factor.label === "Action verbs at bullet starts").score;
  assert.equal(scoreOf(oneRecognized), scoreOf(withUnlisted));
});

test("PDF extraction preserves headings, bullets, wrapped text, and multiple text columns", async () => {
  const rows = [
    [{ text: "Professional Summary", x: 20, y: 700 }],
    [{ text: "∗", x: 20, y: 680 }, { text: "Improved model accuracy by", x: 30, y: 680 }],
    [{ text: "15% through data cleaning.", x: 30, y: 668 }],
    [{ text: "Technical Skills", x: 20, y: 650 }, { text: "Python", x: 320, y: 650 }],
  ];
  const items = rows.flatMap((row) => row.map(({ text, x, y }) => ({
    str: text,
    transform: [1, 0, 0, 10, x, y],
    width: text.length * 4,
    height: 10,
  })));
  const result = await extractPdfResumeText({
    numPages: 1,
    getPage: async () => ({ getTextContent: async () => ({ items }) }),
  });
  assert.match(result.text, /Professional Summary/);
  assert.match(result.text, /∗ Improved model accuracy by 15% through data cleaning\./);
  assert.match(result.text, /Technical Skills\nPython/);
});

test("low-quality or scanned PDF text is marked for OCR and its score is not trusted", async () => {
  const scanned = await extractPdfResumeText({
    numPages: 1,
    getPage: async () => ({ getTextContent: async () => ({ items: [] }) }),
  });
  assert.equal(scanned.extraction.requiresOcr, true);
  assert.match(scanned.extraction.warning, /OCR is required/);
  const lowConfidence = analyzeResumeText(actionResume.slice(0, 240), {
    warning: "Only partial PDF text was extracted.",
    skillCatalog: [],
  });
  assert.equal(lowConfidence.confidence.level, "low");
  assert.match(lowConfidence.confidence.warning, /partial PDF text/);

  const partialScanned = await extractPdfResumeText({
    numPages: 2,
    getPage: async (number) => ({
      getTextContent: async () => ({ items: number === 1 ? [] : [{ str: "Readable page text", transform: [1, 0, 0, 10, 20, 700], width: 90 }] }),
    }),
  });
  assert.equal(partialScanned.extraction.requiresOcr, true);
  assert.match(partialScanned.extraction.warning, /one or more PDF pages/i);
});

const regressionPdfPath = process.env.RESUME_REGRESSION_PDF;
test("Himanshu_CV.pdf regression recognizes expected evidence from the real PDF", { skip: !regressionPdfPath }, async () => {
  const bytes = new Uint8Array(await readFile(regressionPdfPath));
  const loadingTask = pdfjs.getDocument({ data: bytes, verbosity: 0 });
  const pdf = await loadingTask.promise;
  try {
    const { text, extraction } = await extractPdfResumeText(pdf);
    const analysis = analyzeResumeText(text, {
      ...extraction,
      skillCatalog: ["Python", "SQL", "Machine Learning", "Generative AI", "Data Analytics", "Power BI", "Robotics", "Arduino"],
    });
    assert.ok(analysis);
    assert.equal(validateResumeText(text).valid, true);
    assert.equal(analysis.confidence.level, "high");
    assert.ok(analysis.contact.phone.values.some((phone) => phone.replace(/\D/g, "").endsWith("9532696131")));
    assert.ok(analysis.contact.email.values.some((email) => email.toLowerCase() === "himanshugupta95326@gmail.com"));
    assert.equal(analysis.presentSections.length, 6);
    for (const section of ["summary", "skills", "experience", "projects", "certifications", "education"]) {
      assert.ok(analysis.presentSections.includes(section), `Expected ${section} section`);
    }
    const detectedVerbs = new Set(analysis.actionBullets.map(({ verb }) => verb.toLowerCase()));
    for (const verb of ["deliver", "conduct", "manage", "guided", "supported", "trained", "delivered", "enhanced", "boosted", "automated", "optimized", "built", "developed", "implemented"]) {
      assert.ok(detectedVerbs.has(verb), `Expected action verb ${verb}`);
    }
    for (const value of ["15", "20", "50", "30", "90"]) {
      assert.ok(analysis.quantifiedClaims.some((claim) => claim.value === value), `Expected measurable result ${value}`);
    }
    const factor = (label) => analysis.atsReadiness.factors.find((item) => item.label === label);
    assert.equal(factor("Standard section headings").score, Math.round((6 / 8) * 30));
    assert.equal(factor("Contact details").score, 20);
    assert.equal(factor("Recognized skill terms").score, Math.round((Math.min(analysis.foundSkills.length, 8) / 8) * 20));
    assert.equal(factor("Action verbs at bullet starts").score, Math.min(15, analysis.actionBullets.length * 5));
    assert.equal(factor("Measurable-result phrases").score, Math.min(15, analysis.quantifiedClaims.length * 5));
    assert.equal(analysis.atsReadiness.score, analysis.atsReadiness.factors.reduce((sum, item) => sum + item.score, 0));
    assert.ok(analysis.atsReadiness.score <= 100);
  } finally {
    await loadingTask.destroy();
  }
});
