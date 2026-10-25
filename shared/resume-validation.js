const RESUME_HEADINGS = [
  "summary",
  "professional summary",
  "career summary",
  "profile summary",
  "professional profile",
  "objective",
  "experience",
  "work experience",
  "professional experience",
  "employment history",
  "work history",
  "education",
  "academic background",
  "educational background",
  "projects",
  "personal projects",
  "skills",
  "technical skills",
  "core skills",
  "core competencies",
  "certifications",
  "professional certificates",
  "professional certifications",
  "certificates",
  "achievements",
  "publications",
  "research publications",
  "internships",
];

const NON_RESUME_DOCUMENT_PATTERNS = [
  /\b(?:electricity|utility|water|gas)\s+bill\b/i,
  /\b(?:consumer|account|meter)\s*(?:number|no\.?|id)\b/i,
  /\b(?:amount due|total due|bill period|units consumed|meter reading|kilowatt[\s-]?hours?|kwh)\b/i,
  /\b(?:invoice|tax invoice|payment receipt|transaction receipt|bank statement)\b/i,
  /\b(?:marksheet|mark sheet|grade card|transcript|hall ticket|admit card)\b/i,
];

export function validateResumeText(text) {
  const normalizedText = typeof text === "string" ? text.trim() : "";
  if (normalizedText.length < 80) {
    return { valid: false, error: "This file does not contain enough readable text to analyze as a resume." };
  }

  if (NON_RESUME_DOCUMENT_PATTERNS.some((pattern) => pattern.test(normalizedText))) {
    return { valid: false, error: "This looks like a bill, receipt, or another non-resume document. Upload a resume to get resume analysis." };
  }

  const headingsFound = RESUME_HEADINGS.filter((heading) => (
    new RegExp(`(?:^|\\n)\\s*${heading}\\s*:?\\s*(?:\\n|$)`, "im").test(normalizedText)
  ));
  const hasContact = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(normalizedText)
    || /(?:\+?\d[\d\s().-]{8,}\d)/.test(normalizedText);
  const hasCareerContext = /\b(?:work experience|professional experience|employment history|worked as|work as|job title|responsibilities|internship|career objective|years of experience|professional summary)\b/i.test(normalizedText);

  if (headingsFound.length >= 2 || (headingsFound.length >= 1 && (hasContact || hasCareerContext))) {
    return { valid: true, error: "" };
  }

  return {
    valid: false,
    error: "This file does not look like a resume. Upload a resume with sections such as Experience, Education, Projects, or Skills.",
  };
}
