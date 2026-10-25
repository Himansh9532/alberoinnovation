const SECTION_ALIASES = new Map([
  ["summary", "summary"],
  ["professional summary", "summary"],
  ["profile", "summary"],
  ["experience", "experience"],
  ["work experience", "experience"],
  ["professional experience", "experience"],
  ["employment history", "experience"],
  ["education", "education"],
  ["academic background", "education"],
  ["projects", "projects"],
  ["personal projects", "projects"],
  ["selected projects", "projects"],
  ["skills", "skills"],
  ["technical skills", "skills"],
  ["core skills", "skills"],
  ["core competencies", "skills"],
  ["certifications", "certifications"],
  ["professional certificates", "certifications"],
  ["certificates", "certifications"],
  ["achievements", "achievements"],
  ["awards", "achievements"],
  ["publications", "publications"],
  ["research publications", "publications"],
  ["internships", "internships"],
  ["training", "training"],
  ["languages", "languages"],
]);

const STANDARD_SECTIONS = new Set([
  "summary",
  "experience",
  "education",
  "projects",
  "skills",
  "certifications",
  "achievements",
  "publications",
  "internships",
  "training",
  "languages",
]);

function cleanInlineMarkdown(value) {
  return value
    .replace(/^\s{0,6}#{1,6}\s+/, "")
    .replace(/\[([^\]]+)\]\((?:mailto:)?[^)]+\)/gi, "$1")
    .replace(/\*\*(.*?)\*\*/g, "$1")
    .replace(/__(.*?)__/g, "$1")
    .trim();
}

function normalizeHeading(value) {
  return cleanInlineMarkdown(value)
    .replace(/^\s*#+\s*/, "")
    .replace(/\s*#+\s*$/, "")
    .replace(/[:：]+$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function isPlainTextHeading(line) {
  const value = cleanInlineMarkdown(line).replace(/[:：]+$/, "").trim();
  return value.length > 0 && value.length <= 55 && value === value.toUpperCase();
}

function normalizeLink(value) {
  return value.replace(/^https?:\/\//i, "").replace(/\/+$/, "");
}

function extractContactValue(text, label, pattern) {
  const labeled = text.match(new RegExp(`(?:^|\\n)\\s*${label}\\s*:\\s*([^\\n]+)`, "i"))?.[1];
  const match = labeled?.match(pattern) || text.match(pattern);
  return match ? match[0].replace(/[),.;]+$/, "") : "";
}

function extractPhone(text) {
  const labeled = text.match(/(?:^|\n)\s*(?:phone|mobile|tel(?:ephone)?)\s*:\s*([^\n]+)/i)?.[1];
  const candidates = labeled ? [labeled] : text.match(/\+?\d[\d\s().-]{6,}\d/g) || [];
  for (const candidate of candidates) {
    const digits = candidate.replace(/\D/g, "");
    if (digits.length >= 8 && digits.length <= 15) return candidate.trim().replace(/[),.;]+$/, "");
  }
  return "";
}

function sectionKeyForHeading(heading) {
  const normalized = normalizeHeading(heading);
  const section = SECTION_ALIASES.get(normalized);
  return section || `custom:${cleanInlineMarkdown(heading).replace(/[:：]+$/, "").trim()}`;
}

export function parseResumeBuilderText(input) {
  const text = String(input || "").replace(/\r\n?/g, "\n").trim();
  if (!text) return { profile: {}, sections: [], error: "Paste resume text to import." };

  const lines = text.split("\n");
  const contentSections = [];
  const preamble = [];
  let currentSection = null;

  for (const line of lines) {
    const markdownHeading = line.match(/^\s{0,3}(#{1,6})\s+(.+?)\s*#*\s*$/);
    const heading = markdownHeading?.[2] || line;
    const headingLevel = markdownHeading?.[1].length || 0;
    const recognizedSection = SECTION_ALIASES.has(normalizeHeading(heading));
    const plainHeading = !markdownHeading && (isPlainTextHeading(line) || recognizedSection);
    if ((markdownHeading && (recognizedSection || headingLevel === 2)) || plainHeading) {
      currentSection = { key: sectionKeyForHeading(heading), label: cleanInlineMarkdown(heading).replace(/[:：]+$/, "").trim(), lines: [] };
      contentSections.push(currentSection);
      continue;
    }
    if (currentSection) currentSection.lines.push(line);
    else preamble.push(line);
  }

  const preambleText = preamble.join("\n");
  const preambleLines = preamble.map((line) => cleanInlineMarkdown(line)).filter(Boolean);
  const contactPatterns = {
    email: /[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/i,
    linkedin: /(?:https?:\/\/)?(?:www\.)?linkedin\.com\/in\/[A-Z0-9_-]+\/?/i,
    github: /(?:https?:\/\/)?(?:www\.)?github\.com\/[A-Z0-9_-]+\/?/i,
  };
  const contactLines = preambleLines.filter((line) => /^(?:phone|mobile|tel(?:ephone)?|email|e-mail|linkedin|github)\s*:/i.test(line));
  const nonContactLines = preambleLines.filter((line) => !/^(?:phone|mobile|tel(?:ephone)?|email|e-mail|linkedin|github)\s*:/i.test(line));
  const profile = {
    name: nonContactLines[0]?.replace(/^#+\s*/, "").trim() || "",
    headline: nonContactLines.slice(1).join(" ").trim(),
    phone: extractPhone(`${contactLines.join("\n")}\n${preambleText}`),
    email: extractContactValue(`${contactLines.join("\n")}\n${preambleText}`, "e?mail", contactPatterns.email),
    linkedin: normalizeLink(extractContactValue(`${contactLines.join("\n")}\n${preambleText}`, "linkedin", contactPatterns.linkedin)),
    github: normalizeLink(extractContactValue(`${contactLines.join("\n")}\n${preambleText}`, "github", contactPatterns.github)),
  };

  const sections = [];
  for (const section of contentSections) {
    const content = section.lines.map((line) => {
      const subsectionHeading = line.match(/^\s{0,3}#{3,6}\s+(.+?)\s*#*\s*$/);
      if (subsectionHeading) return `**${cleanInlineMarkdown(subsectionHeading[1])}**`;
      return line
        .replace(/^\s{0,6}#{1,2}\s+/, "")
        .replace(/\[([^\]]+)\]\((?:mailto:)?[^)]+\)/gi, "$1")
        .trim();
    }).join("\n").trim();
    if (!content) continue;
    const existing = sections.find((item) => item.key === section.key);
    if (existing) existing.content = `${existing.content}\n\n${content}`;
    else sections.push({ key: section.key, label: STANDARD_SECTIONS.has(section.key) ? section.key.charAt(0).toUpperCase() + section.key.slice(1) : section.label, content });
  }

  for (const section of sections) profile[section.key] = section.content;
  profile.experienceEntries = [];
  return { profile, sections, error: "" };
}
