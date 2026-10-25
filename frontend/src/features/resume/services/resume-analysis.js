export const SECTION_HEADINGS = {
  summary: ["summary", "professional summary", "career summary", "profile", "profile summary", "professional profile", "objective", "career objective", "about"],
  experience: ["experience", "work experience", "professional experience", "employment", "employment history", "work history"],
  education: ["education", "academic", "academic background", "educational background"],
  projects: ["projects", "project", "personal projects", "selected projects"],
  skills: ["skills", "technical skills", "core skills", "core competencies", "competencies"],
  certifications: ["certifications", "certificates", "professional certificates", "professional certifications", "professional certificate"],
  achievements: ["achievements", "awards", "honors", "honours"],
  publications: ["publications", "papers", "research publications", "selected publications"],
};

export const ACTION_VERBS = new Set([
  "achieve", "achieved", "analyze", "analyzed", "analyse", "analysed", "automate", "automated",
  "boost", "boosted", "build", "built", "conduct", "conducted", "create", "created", "deliver",
  "delivered", "develop", "developed", "design", "designed", "enhance", "enhanced", "guide",
  "guided", "implement", "implemented", "improve", "improved", "launch", "launched", "lead", "led",
  "manage", "managed", "optimize", "optimized", "optimise", "optimised", "reduce", "reduced", "train",
  "trained", "support", "supported", "increase", "increased", "organize", "organized", "organise",
  "organised", "coordinate", "coordinated", "generate", "generated", "streamline", "streamlined",
  "execute", "executed", "engineer", "engineered", "facilitate", "facilitated", "mentor", "mentored",
  "establish", "established", "deploy", "deployed", "evaluate", "evaluated", "present", "presented",
  "resolve", "resolved", "maintain", "maintained", "collaborate", "collaborated", "prepare", "prepared",
  "transform", "transformed", "strengthen", "strengthened",
]);

const BULLET_PREFIX = /^\s*[•◦▪▫‣⁃∙·∗*−–—-]\s*/u;
const OUTCOME_TERMS = /\b(?:achiev(?:e|ed|ing)|boost(?:ed|s|ing)?|improv(?:e|ed|ing)|enhanc(?:e|ed|ing)|increas(?:e|ed|ing)|reduc(?:e|ed|ing)|automat(?:e|ed|ing)|sav(?:e|ed|ing)|optim(?:ize|ise|ized|ised|izing|ising)|grow|grew|deliver(?:ed|s|ing)?|rais(?:e|ed|ing)|cut|lower(?:ed|ing)|process(?:ed|ing)?|accuracy|performance|efficiency|productivity|error|cost|revenue|time|latency|throughput|conversion|retention|precision|recall|pipeline|processing|satisfaction|uptime|response time|turnaround)\b/i;
const MEASURE_UNIT = /(?:%|percent\b|percentage\b|[$€£₹]|\b(?:INR|USD|EUR|GBP|rupees?|hours?|hrs?|minutes?|mins?|days?|weeks?|months?|years?|x|times|users?|customers?|clients?|students?|learners?|employees?|projects?|records?|applications?|requests?|tasks?|models?|datasets?|queries|transactions?|reports?|teams?|cohorts?|workshops?|cases?|people|items?|units?|points?|basis points?|GB|TB|MB|ms|seconds?)\b)/i;
const NUMBER_PATTERN = /(?:[$€£₹]\s*)?\b\d{1,3}(?:,\d{3})+(?:\.\d+)?|\b\d+(?:\.\d+)?/g;

export function normalizeResumeText(text) {
  return (typeof text === "string" ? text : "")
    .replace(/\r\n?/g, "\n")
    .replace(/[\u0000-\u0008\u000B\u000C\u000E-\u001F\u007F-\u009F]/g, "")
    .replace(/[\u00AD\u200B-\u200D\uFEFF]/g, "")
    .replace(/\u00A0/g, " ")
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").replace(/[ \t]+$/g, ""))
    .join("\n")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

export function normalizeHeading(line) {
  return line
    .replace(/^\s*\d{1,2}[.)-]\s*/, "")
    .replace(/^\s*[#>*•◦▪▫‣⁃∙·∗*-]+\s*/, "")
    .replace(/^\*\*(.*)\*\*$/, "$1")
    .replace(/[*_`]/g, "")
    .replace(/[：:：.,;|]+$/g, "")
    .replace(/[()[\]{}]/g, " ")
    .replace(/[–—-]/g, " ")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

export function detectResumeSections(text) {
  const normalized = normalizeResumeText(text);
  const lines = normalized.split("\n").map(normalizeHeading);
  return Object.entries(SECTION_HEADINGS).flatMap(([section, headings]) => {
    const detectedHeading = lines.find((line) => headings.includes(line));
    return detectedHeading ? [{ section, heading: detectedHeading }] : [];
  });
}

export function sectionExists(text, section) {
  return detectResumeSections(text).some((item) => item.section === section);
}

export function detectContactDetails(text) {
  const normalized = normalizeResumeText(text);
  const emails = [...new Set(normalized.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) || [])];
  const phoneCandidates = normalized.match(/(?<![A-Za-z0-9])\+?\d[\d\s().-]{7,18}\d(?!\d)/g) || [];
  const phones = [...new Set(phoneCandidates
    .map((candidate) => candidate.trim().replace(/\s+/g, " "))
    .filter((candidate) => {
      const digits = candidate.replace(/\D/g, "");
      return digits.length >= 10 && digits.length <= 15;
    }))];
  return {
    email: { found: emails.length > 0, values: emails },
    phone: { found: phones.length > 0, values: phones },
  };
}

function collectBullets(text) {
  const bullets = [];
  let current = null;
  let previousWasBlank = true;

  for (const rawLine of text.split("\n")) {
    const line = rawLine.trim();
    if (!line) {
      current = null;
      previousWasBlank = true;
      continue;
    }
    const bulletMatch = rawLine.match(BULLET_PREFIX);
    if (bulletMatch) {
      current = rawLine.slice(bulletMatch[0].length).trim();
      if (current) bullets.push(current);
      previousWasBlank = false;
      continue;
    }

    const normalizedLine = normalizeHeading(line);
    const isHeading = Object.values(SECTION_HEADINGS).flat().includes(normalizedLine);
    if (current && !previousWasBlank && !isHeading && (/^\s/.test(rawLine) || /[-\u00AD]$/.test(current))) {
      current = `${current.replace(/[-\u00AD]$/, "")} ${line}`.replace(/\s+/g, " ").trim();
      bullets[bullets.length - 1] = current;
    } else {
      current = null;
    }
    previousWasBlank = false;
  }
  return bullets;
}

function getActionVerb(bullet) {
  const match = bullet.match(/^([A-Za-z]+)\b/);
  if (!match) return null;
  const verb = match[1].toLowerCase();
  return ACTION_VERBS.has(verb) ? match[1] : null;
}

function isDateLikeNumber(numberText, context) {
  const digits = numberText.replace(/\D/g, "");
  if (digits.length === 4 && Number(digits) >= 1900 && Number(digits) <= 2099) return true;
  if (!MEASURE_UNIT.test(context)) return true;
  return false;
}

function detectMeasurableResults(text, bullets) {
  const blocks = [...bullets, ...text.split(/\n+/).filter(Boolean)];
  const results = [];
  const seen = new Set();
  for (const rawBlock of blocks) {
    const block = rawBlock.replace(BULLET_PREFIX, "").trim();
    if (!OUTCOME_TERMS.test(block) || !MEASURE_UNIT.test(block)) continue;
    for (const match of block.matchAll(NUMBER_PATTERN)) {
      const numberText = match[0];
      const start = Math.max(0, match.index - 100);
      const end = Math.min(block.length, match.index + numberText.length + 100);
      const context = block.slice(start, end);
      if (isDateLikeNumber(numberText, context)) continue;
      if (!OUTCOME_TERMS.test(context) || !MEASURE_UNIT.test(context)) continue;
      const snippet = block.length > 240 ? `${block.slice(0, 237).trimEnd()}...` : block;
      const key = `${numberText.toLowerCase()}|${snippet.toLowerCase()}`;
      if (seen.has(key)) continue;
      seen.add(key);
      results.push({ value: numberText, snippet });
    }
  }
  return results;
}

function extractionConfidence(text, extraction = {}) {
  const replacementCount = (text.match(/\uFFFD/g) || []).length;
  const replacementRatio = replacementCount / Math.max(text.length, 1);
  if (extraction.requiresOcr) {
    return { level: "low", warning: "This PDF has no selectable text. It may be scanned; OCR is required before analysis." };
  }
  if (extraction.warning) return { level: "low", warning: extraction.warning };
  if (text.length < 300 || replacementRatio > 0.01) {
    return {
      level: "low",
      warning: "Text extraction confidence is low. Check the extracted text against the original PDF; the score is hidden until the text is more complete.",
    };
  }
  return { level: "high", warning: "" };
}

export function analyzeResumeText(sourceText, extraction = {}) {
  const text = normalizeResumeText(sourceText);
  if (text.length < 80) return null;

  const detectedSections = detectResumeSections(text);
  const presentSections = detectedSections.map(({ section }) => section);
  const skillCatalog = Array.isArray(extraction.skillCatalog) ? extraction.skillCatalog : [];
  const foundSkills = skillCatalog.filter((skill) => (
    new RegExp(`(^|[^a-z0-9])${skill.replace(/[.*+?^${}()|[\]\\]/g, "\\$&")}(?=$|[^a-z0-9])`, "i").test(text)
  ));
  const contact = detectContactDetails(text);
  const bullets = collectBullets(text);
  const actionBullets = bullets.flatMap((snippet) => {
    const verb = getActionVerb(snippet);
    return verb ? [{ verb, snippet }] : [];
  });
  const quantifiedClaims = detectMeasurableResults(text, bullets);
  const confidence = extractionConfidence(text, extraction);
  const scoreFactors = [];
  const skillScore = Math.round((Math.min(foundSkills.length, 8) / 8) * 20);
  scoreFactors.push(
    {
      label: "Standard section headings",
      score: Math.round((presentSections.length / Object.keys(SECTION_HEADINGS).length) * 30),
      max: 30,
      detail: `${presentSections.length} of ${Object.keys(SECTION_HEADINGS).length} configured headings detected: ${presentSections.join(", ") || "none"}`,
    },
    {
      label: "Contact details",
      score: (contact.email.found ? 10 : 0) + (contact.phone.found ? 10 : 0),
      max: 20,
      detail: `${contact.email.found ? "Email found" : "Email not found"} · ${contact.phone.found ? "Phone found" : "Phone not found"}`,
    },
    {
      label: "Recognized skill terms",
      score: skillScore,
      max: 20,
      detail: `${foundSkills.length} catalog terms · up to 8 count`,
    },
    {
      label: "Action verbs at bullet starts",
      score: Math.min(15, actionBullets.length * 5),
      max: 15,
      detail: `${actionBullets.length} recognized action-verb examples · up to 3 count; unlisted bullet openings do not reduce this score`,
    },
    {
      label: "Measurable-result phrases",
      score: Math.min(15, quantifiedClaims.length * 5),
      max: 15,
      detail: `${quantifiedClaims.length} measurable number-and-outcome patterns found · up to 3 count`,
    },
  );
  const atsScore = scoreFactors.reduce((total, factor) => total + Math.min(factor.max, Math.max(0, factor.score)), 0);
  return {
    foundSkills,
    presentSections,
    detectedSections,
    missingSections: Object.keys(SECTION_HEADINGS).filter((section) => !presentSections.includes(section)),
    contact,
    quantifiedClaims,
    bullets,
    actionBullets,
    confidence,
    atsReadiness: {
      score: atsScore,
      label: atsScore >= 80 ? "Strong signals" : atsScore >= 60 ? "Good signals" : atsScore >= 40 ? "Developing" : "Needs attention",
      factors: scoreFactors,
    },
    wordCount: text.split(/\s+/).filter(Boolean).length,
  };
}

function groupPdfTextItems(items, pageWidth) {
  const spans = items
    .filter((item) => typeof item.str === "string" && item.str.trim())
    .map((item) => ({
      text: item.str.replace(/\s+/g, " ").trim(),
      x: item.transform?.[4] || 0,
      y: item.transform?.[5] || 0,
      width: item.width || 0,
      fontSize: Math.abs(item.transform?.[3] || item.height || 10),
    }))
    .sort((first, second) => second.y - first.y || first.x - second.x);
  const rows = [];

  for (const span of spans) {
    const tolerance = Math.max(1.5, span.fontSize * 0.22);
    let row = rows.find((candidate) => Math.abs(candidate.y - span.y) <= tolerance);
    if (!row) {
      row = { y: span.y, spans: [] };
      rows.push(row);
    }
    row.spans.push(span);
  }
  const lineFragments = rows
    .sort((first, second) => second.y - first.y)
    .flatMap((row) => {
      row.spans.sort((first, second) => first.x - second.x);
      const fragments = [];
      let spansInFragment = [];
      let previous = null;
      for (const span of row.spans) {
        const gap = previous ? span.x - (previous.x + previous.width) : 0;
        if (spansInFragment.length && gap > pageWidth * 0.22) {
          fragments.push(spansInFragment);
          spansInFragment = [];
          previous = null;
        }
        spansInFragment.push(span);
        previous = span;
      }
      if (spansInFragment.length) fragments.push(spansInFragment);
      return fragments.map((fragment) => {
        let line = "";
        let previousSpan = null;
        for (const span of fragment) {
          const gap = previousSpan ? span.x - (previousSpan.x + previousSpan.width) : 0;
          if (line && gap > Math.max(1, span.fontSize * 0.12) && !line.endsWith(" ")) line += " ";
          line += span.text;
          previousSpan = span;
        }
        return {
          text: line.replace(/\s+/g, " ").trim(),
          x: fragment[0]?.x || 0,
          y: row.y,
        };
      });
    })
    .sort((first, second) => second.y - first.y || first.x - second.x);
  return lineFragments
    .filter((row) => row.text);
}

function joinWrappedPdfLines(rows) {
  const output = [];
  let previousBullet = null;
  for (const row of rows) {
    const line = row.text;
    if (BULLET_PREFIX.test(line)) {
      output.push(line);
      const match = line.match(BULLET_PREFIX);
      previousBullet = { outputIndex: output.length - 1, textStart: row.x + (match?.[0].length || 0) * 4 };
      continue;
    }
    const normalizedLine = normalizeHeading(line);
    const isHeading = Object.values(SECTION_HEADINGS).flat().includes(normalizedLine);
    if (previousBullet && !isHeading && Math.abs(row.x - previousBullet.textStart) <= 32) {
      output[previousBullet.outputIndex] = `${output[previousBullet.outputIndex]} ${line}`.replace(/\s+/g, " ").trim();
    } else {
      output.push(line);
      previousBullet = null;
    }
  }
  return output.join("\n");
}

export async function extractPdfResumeText(pdfDocument) {
  const pages = [];
  let totalTextItems = 0;
  for (let number = 1; number <= pdfDocument.numPages; number += 1) {
    const page = await pdfDocument.getPage(number);
    const content = await page.getTextContent({ includeMarkedContent: false });
    totalTextItems += content.items.length;
    const pageWidth = Math.abs(page.view?.[2] - page.view?.[0]) || 612;
    pages.push(joinWrappedPdfLines(groupPdfTextItems(content.items, pageWidth)));
  }
  const text = normalizeResumeText(pages.join("\n\n"));
  if (!text) {
    return {
      text,
      extraction: { requiresOcr: true, warning: "This PDF has no selectable text. It may be scanned; OCR is required before analysis." },
    };
  }
  const emptyPage = pages.some((page) => page.length === 0);
  const warning = emptyPage
    ? "One or more PDF pages have no selectable text. They may be scanned; OCR is required for complete analysis."
    : text.length < 300
      ? "Only a small amount of selectable text was found. This PDF may be scanned or incompletely extracted; check the source before relying on analysis."
      : "";
  return {
    text,
    extraction: {
      pageCount: pdfDocument.numPages,
      textItemCount: totalTextItems,
      requiresOcr: emptyPage,
      warning,
    },
  };
}
