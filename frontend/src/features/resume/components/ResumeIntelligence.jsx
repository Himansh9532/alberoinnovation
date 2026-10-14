import { useEffect, useMemo, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import {
  ArrowRight,
  BarChart3,
  BriefcaseBusiness,
  Check,
  ChevronRight,
  Download,
  ExternalLink,
  FileCheck2,
  FileText,
  FileUp,
  FolderKanban,
  Github,
  GraduationCap,
  Linkedin,
  Lightbulb,
  ListChecks,
  Mail,
  Phone,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  Trash2,
  UserRound,
} from "lucide-react";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { apiRequest } from "../../../services/api-client.js";
import { getPhotoBytes, resizeResumePhoto } from "../services/resume-photo.js";

const PROFILE_KEY = "skillai-resume-profile";
const RESUME_KEY = "skillai-resume-text";
const JOB_FEED_CACHE_TTL = 60 * 60 * 1000;
let publicJobFeedCache = null;

const ROLES = [
  { sector: "Engineering & Technology", name: "Software Developer", skills: ["JavaScript", "Python", "Java", "software development", "Git", "testing", "API"] },
  { sector: "Engineering & Technology", name: "Data Analyst", skills: ["SQL", "Excel", "Python", "Power BI", "Tableau", "statistics", "visualization"] },
  { sector: "Engineering & Technology", name: "Data Scientist", skills: ["Python", "SQL", "machine learning", "statistics", "pandas", "visualization", "modeling"] },
  { sector: "Engineering & Technology", name: "ML Engineer", skills: ["Python", "machine learning", "TensorFlow", "PyTorch", "deployment", "API", "Docker"] },
  { sector: "Engineering & Technology", name: "Mechanical Design Engineer", skills: ["CAD", "SolidWorks", "AutoCAD", "manufacturing", "GD&T", "thermodynamics", "design"] },
  { sector: "Engineering & Technology", name: "Civil Engineer", skills: ["AutoCAD", "structural design", "construction", "project management", "surveying", "site supervision", "safety"] },
  { sector: "Engineering & Technology", name: "Electrical Engineer", skills: ["power systems", "electrical design", "PLC", "control systems", "renewable energy", "circuit design", "safety"] },
  { sector: "Engineering & Technology", name: "Electronics & Embedded Engineer", skills: ["embedded systems", "C", "microcontrollers", "PCB design", "signal processing", "IoT", "testing"] },
  { sector: "Engineering & Technology", name: "Chemical Engineer", skills: ["process engineering", "process safety", "quality control", "chemical processes", "materials", "manufacturing", "regulatory"] },
  { sector: "Engineering & Technology", name: "Robotics & Automation Engineer", skills: ["robotics", "automation", "PLC", "control systems", "C++", "sensors", "machine vision"] },
  { sector: "Business & Finance", name: "Business Analyst", skills: ["requirements", "SQL", "Excel", "stakeholder", "process", "Power BI", "communication"] },
  { sector: "Business & Finance", name: "Accountant", skills: ["accounting", "financial reporting", "taxation", "auditing", "GST", "Excel", "compliance"] },
  { sector: "Business & Finance", name: "Financial Analyst", skills: ["financial modeling", "financial analysis", "forecasting", "Excel", "valuation", "budgeting", "reporting"] },
  { sector: "Business & Finance", name: "Human Resources Specialist", skills: ["recruitment", "employee relations", "HR", "onboarding", "performance management", "communication", "compliance"] },
  { sector: "Business & Finance", name: "Marketing Specialist", skills: ["marketing", "market research", "campaigns", "content strategy", "SEO", "analytics", "communication"] },
  { sector: "Business & Finance", name: "Operations Manager", skills: ["operations", "process improvement", "project management", "supply chain", "quality", "leadership", "planning"] },
  { sector: "Healthcare & Life Sciences", name: "Registered Nurse", skills: ["patient care", "clinical practice", "nursing", "patient safety", "care planning", "communication", "documentation"] },
  { sector: "Healthcare & Life Sciences", name: "Physiotherapist", skills: ["physiotherapy", "rehabilitation", "patient assessment", "exercise therapy", "anatomy", "care planning", "communication"] },
  { sector: "Healthcare & Life Sciences", name: "Medical Laboratory Technologist", skills: ["medical laboratory", "diagnostics", "sample analysis", "quality control", "laboratory safety", "documentation", "microbiology"] },
  { sector: "Healthcare & Life Sciences", name: "Public Health Officer", skills: ["public health", "epidemiology", "health promotion", "community health", "research", "data analysis", "program management"] },
  { sector: "Healthcare & Life Sciences", name: "Pharmacist", skills: ["pharmacy", "pharmacology", "medication safety", "patient counseling", "dispensing", "regulatory", "inventory management"] },
  { sector: "Healthcare & Life Sciences", name: "Biotechnologist", skills: ["biotechnology", "molecular biology", "microbiology", "cell culture", "laboratory techniques", "quality assurance", "research"] },
  { sector: "Science & Research", name: "Research Assistant", skills: ["research", "literature review", "data collection", "data analysis", "scientific writing", "laboratory techniques", "ethics"] },
  { sector: "Science & Research", name: "Environmental Scientist", skills: ["environmental science", "sustainability", "environmental impact", "field sampling", "data analysis", "GIS", "regulatory"] },
  { sector: "Design & Creative Arts", name: "Graphic Designer", skills: ["graphic design", "Adobe Illustrator", "Photoshop", "typography", "branding", "visual communication", "portfolio"] },
  { sector: "Design & Creative Arts", name: "UX / Product Designer", skills: ["user research", "Figma", "prototyping", "wireframing", "usability testing", "accessibility", "interaction design"] },
  { sector: "Design & Creative Arts", name: "Content Writer", skills: ["content writing", "copywriting", "editing", "research", "storytelling", "SEO", "communication"] },
  { sector: "Design & Creative Arts", name: "Animator", skills: ["animation", "storyboarding", "3D modeling", "visual storytelling", "Adobe After Effects", "Blender", "portfolio"] },
  { sector: "Law & Public Service", name: "Legal Associate", skills: ["legal research", "case analysis", "drafting", "contract review", "litigation", "compliance", "communication"] },
  { sector: "Law & Public Service", name: "Policy Analyst", skills: ["policy analysis", "research", "public policy", "data analysis", "report writing", "stakeholder", "governance"] },
  { sector: "Law & Public Service", name: "Public Administration Officer", skills: ["public administration", "governance", "public service", "policy", "program management", "communication", "compliance"] },
  { sector: "Agriculture & Environment", name: "Agronomist", skills: ["agronomy", "crop science", "soil science", "field research", "sustainable agriculture", "pest management", "data collection"] },
  { sector: "Agriculture & Environment", name: "Agribusiness Specialist", skills: ["agribusiness", "supply chain", "market research", "agricultural economics", "operations", "communication", "project management"] },
  { sector: "Education & Humanities", name: "Teacher / Educator", skills: ["teaching", "lesson planning", "classroom management", "curriculum", "assessment", "communication", "inclusive education"] },
  { sector: "Education & Humanities", name: "Instructional Designer", skills: ["instructional design", "curriculum development", "e-learning", "learning management system", "assessment", "accessibility", "content development"] },
  { sector: "Education & Humanities", name: "Communications Specialist", skills: ["communication", "writing", "editing", "public relations", "research", "storytelling", "languages"] },
];
const SKILL_CATALOG = [...new Set(ROLES.flatMap((role) => role.skills))];
const SECTORS = [...new Set(ROLES.map((role) => role.sector))];
const SECTIONS = ["Summary", "Experience", "Education", "Projects", "Skills", "Certifications", "Achievements", "Publications", "Internships", "Training", "Languages"];
const SECTION_HEADINGS = {
  summary: ["summary", "professional summary", "career summary", "profile", "profile summary", "objective", "about"],
  experience: ["experience", "work experience", "professional experience", "employment", "employment history", "work history"],
  education: ["education", "academic", "academic background"],
  projects: ["projects", "project", "personal projects"],
  skills: ["skills", "technical skills", "competencies"],
  certifications: ["certifications", "certificates"],
  achievements: ["achievements", "awards", "honors"],
  publications: ["publications", "papers"],
};

function readStored(key, fallback) {
  try {
    const value = window.localStorage.getItem(key);
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function writeStored(key, value) {
  window.localStorage.setItem(key, JSON.stringify(value));
}

function sectionExists(text, section) {
  const headings = SECTION_HEADINGS[section] || [section];
  return headings.some((heading) => new RegExp(`(^|\\n)\\s*${heading}\\s*:?\\s*(\\n|$)`, "im").test(text));
}

function addMissingSkillsToResumeDraft(draft, skills) {
  const missingSkills = [...new Set(skills)].filter((skill) => !includesTerm(draft, skill));
  if (!missingSkills.length) return { draft, addedSkills: [] };

  const normalizeHeading = (line) => line
    .trim()
    .replace(/^#+\s*/, "")
    .replace(/^\*\*(.*)\*\*$/, "$1")
    .replace(/[*_`]/g, "")
    .replace(/[:：]\s*$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
  const skillsHeadings = new Set(SECTION_HEADINGS.skills.map(normalizeHeading));
  const allSectionHeadings = new Set(Object.values(SECTION_HEADINGS).flat().map(normalizeHeading));
  const lines = draft.split(/\r?\n/);
  const skillsIndex = lines.findIndex((line) => skillsHeadings.has(normalizeHeading(line)));
  const additions = [];
  for (let index = 0; index < missingSkills.length; index += 5) {
    additions.push(`• ${missingSkills.slice(index, index + 5).join(" · ")}`);
  }

  if (skillsIndex >= 0) {
    let insertAt = lines.length;
    for (let index = skillsIndex + 1; index < lines.length; index += 1) {
      if (allSectionHeadings.has(normalizeHeading(lines[index]))) {
        insertAt = index;
        break;
      }
    }
    lines.splice(insertAt, 0, ...additions);
  } else {
    let insertAt = lines.findIndex((line) => allSectionHeadings.has(normalizeHeading(line)));
    if (insertAt < 0) insertAt = lines.length;
    const skillSection = ["Skills", ...additions];
    if (insertAt > 0 && lines[insertAt - 1]?.trim()) skillSection.unshift("");
    if (insertAt < lines.length && lines[insertAt]?.trim()) skillSection.push("");
    lines.splice(insertAt, 0, ...skillSection);
  }

  return { draft: lines.join("\n").trim(), addedSkills: missingSkills };
}

function scanResume(text) {
  if (!text.trim()) return null;
  const sections = Object.keys(SECTION_HEADINGS);
  const presentSections = sections.filter((section) => sectionExists(text, section));
  const foundSkills = SKILL_CATALOG.filter((skill) => includesTerm(text, skill));
  const quantifiedClaims = [...text.matchAll(/\b(?:increased|improved|reduced|managed|served|supported|achieved|delivered|grew)\b[^.\n]{0,100}\b\d+(?:\.\d+)?%?/gi)]
    .map((match) => match[0].trim());
  const bullets = text.split(/\r?\n/).filter((line) => /^\s*[•*-]\s+/.test(line));
  const actionBullets = bullets.filter((line) => /^\s*[•*-]\s+(?:built|created|developed|led|managed|improved|designed|analyzed|implemented|delivered|reduced|increased|launched)\b/i.test(line));
  const hasEmail = /\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i.test(text);
  const hasPhone = text.split(/\r?\n/).some((line) => {
    const digits = line.replace(/\D/g, "");
    return digits.length >= 10 && digits.length <= 15 && /(?:\+?\d[\d\s().-]{8,}\d)/.test(line);
  });
  const scoreFactors = [
    {
      label: "Standard section headings",
      score: Math.round((presentSections.length / sections.length) * 30),
      max: 30,
      detail: `${presentSections.length} of ${sections.length} detected`,
    },
    {
      label: "Contact details",
      score: (hasEmail ? 10 : 0) + (hasPhone ? 10 : 0),
      max: 20,
      detail: `${hasEmail ? "Email found" : "Email not found"} · ${hasPhone ? "Phone found" : "Phone not found"}`,
    },
    {
      label: "Recognized skill terms",
      score: Math.round((Math.min(foundSkills.length, 8) / 8) * 20),
      max: 20,
      detail: `${foundSkills.length} catalog terms · up to 8 count`,
    },
    {
      label: "Bullet structure",
      score: bullets.length ? 5 + Math.round((actionBullets.length / bullets.length) * 10) : 0,
      max: 15,
      detail: `${actionBullets.length} of ${bullets.length} start with a listed action verb`,
    },
    {
      label: "Measurable-result phrases",
      score: Math.min(quantifiedClaims.length, 3) * 5,
      max: 15,
      detail: `${quantifiedClaims.length} outcome-and-number patterns found · up to 3 count`,
    },
  ];
  const atsReadinessScore = scoreFactors.reduce((total, factor) => total + factor.score, 0);
  return {
    foundSkills,
    presentSections,
    missingSections: sections.filter((section) => !presentSections.includes(section)),
    quantifiedClaims,
    bullets,
    actionBullets,
    atsReadiness: {
      score: atsReadinessScore,
      factors: scoreFactors,
      label: atsReadinessScore >= 80 ? "Strong signals" : atsReadinessScore >= 60 ? "Good signals" : atsReadinessScore >= 40 ? "Developing" : "Needs attention",
    },
    wordCount: text.trim().split(/\s+/).length,
  };
}

function includesTerm(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, "i").test(text);
}

const MATCH_STOP_WORDS = new Set([
  "able", "about", "across", "all", "also", "and", "are", "as", "at", "based", "be", "because",
  "best", "by", "can", "candidate", "company", "day", "degree", "develop", "do", "each", "either",
  "excellent", "for", "from", "good", "have", "help", "in", "include", "including", "industry",
  "into", "is", "it", "job", "join", "knowledge", "least", "looking", "must", "new", "of", "on",
  "or", "our", "per", "position", "preferred", "provide", "related", "role", "skill", "strong",
  "such", "team", "the", "their", "this", "to", "ability", "using", "various", "we", "what",
  "which", "will", "with", "work", "you", "your",
]);
const MATCH_TOKEN_ALIASES = {
  ai: "artificial", "c#": "csharp", "c++": "cplusplus", js: "javascript", jses: "javascript",
  nodejs: "node", "node.js": "node", reactjs: "react", "react.js": "react", ts: "typescript",
  "typescript.js": "typescript", ux: "userexperience", ui: "userinterface", ml: "machinelearning",
  aws: "amazonwebservices", gcp: "googlecloud", postgres: "postgresql", mongo: "mongodb",
};

function normalizeMatchToken(token) {
  const cleaned = token.toLowerCase().replace(/[^a-z0-9+#]/g, "");
  const alias = MATCH_TOKEN_ALIASES[cleaned] || cleaned;
  if (alias.length > 5 && alias.endsWith("ing")) return alias.slice(0, -3);
  if (alias.length > 4 && alias.endsWith("ed")) return alias.slice(0, -2);
  if (alias.length > 4 && alias.endsWith("s")) return alias.slice(0, -1);
  return alias;
}

function extractMatchKeywords(text, excludedSkills = []) {
  const normalizedText = text.toLowerCase();
  const excluded = new Set(excludedSkills.flatMap((skill) => skill.toLowerCase().split(/[^a-z0-9+#]+/).filter(Boolean)));
  const frequencies = new Map();
  for (const token of normalizedText.match(/[a-z][a-z0-9+#.-]{2,}/g) || []) {
    const normalized = normalizeMatchToken(token);
    if (!normalized || MATCH_STOP_WORDS.has(normalized) || excluded.has(token.replace(/[^a-z0-9+#]/g, ""))) continue;
    frequencies.set(normalized, (frequencies.get(normalized) || 0) + 1);
  }
  return [...frequencies.entries()]
    .sort((first, second) => second[1] - first[1] || first[0].localeCompare(second[0]))
    .slice(0, 24)
    .map(([token]) => token);
}

function buildJobMatchReport(resumeText, jobDescription, role) {
  if (resumeText.trim().length < 80 || jobDescription.trim().length < 40 || !role) return null;

  const jdSkills = SKILL_CATALOG.filter((skill) => includesTerm(jobDescription, skill));
  const roleSkills = role.skills;
  const roleSkillsInJd = roleSkills.filter((skill) => includesTerm(jobDescription, skill));
  const requirements = jdSkills.length ? jdSkills : roleSkills;
  const requirementsSource = jdSkills.length
    ? "Catalog skill terms found in the job description"
    : `Selected-role catalog skills for ${role.name}; no catalog skill terms were detected in the job description`;
  const matchedRequirements = requirements.filter((skill) => includesTerm(resumeText, skill));
  const missingRequirements = requirements.filter((skill) => !includesTerm(resumeText, skill));
  const matchedRoleSkills = roleSkills.filter((skill) => includesTerm(resumeText, skill));
  const missingRoleSkills = roleSkills.filter((skill) => !includesTerm(resumeText, skill));
  const jdKeywords = extractMatchKeywords(jobDescription, jdSkills);
  const resumeKeywords = new Set(extractMatchKeywords(resumeText, SKILL_CATALOG));
  const matchedKeywords = jdKeywords.filter((keyword) => resumeKeywords.has(keyword));
  const missingKeywords = jdKeywords.filter((keyword) => !resumeKeywords.has(keyword));
  const evidenceSections = ["summary", "experience", "skills", "projects"];
  const presentEvidence = evidenceSections.filter((section) => sectionExists(resumeText, section));
  const ratio = (numerator, denominator) => denominator ? numerator / denominator : 0;
  const factors = [
    {
      label: "JD requirements",
      weight: 45,
      score: ratio(matchedRequirements.length, requirements.length) * 10,
      detail: `${matchedRequirements.length} of ${requirements.length} role-relevant listed skills found`,
    },
    {
      label: "Target-role skills",
      weight: 25,
      score: ratio(matchedRoleSkills.length, roleSkills.length) * 10,
      detail: `${matchedRoleSkills.length} of ${roleSkills.length} catalog skills for ${role.name} found`,
    },
    {
      label: "JD keyword overlap",
      weight: 20,
      score: ratio(matchedKeywords.length, jdKeywords.length) * 10,
      detail: `${matchedKeywords.length} of ${jdKeywords.length} frequent JD terms also appear in the resume`,
    },
    {
      label: "Evidence sections",
      weight: 10,
      score: ratio(presentEvidence.length, evidenceSections.length) * 10,
      detail: `${presentEvidence.length} of ${evidenceSections.length} relevant section headings detected`,
    },
  ];
  const score = Math.round(factors.reduce((total, factor) => total + factor.score * factor.weight / 100, 0) * 10) / 10;
  const quantifiedClaims = [...resumeText.matchAll(/\b(?:increased|improved|reduced|managed|served|supported|achieved|delivered|grew)\b[^.\n]{0,100}\b\d+(?:\.\d+)?%?/gi)];
  const recommendations = [];

  if (missingRequirements.length) {
    recommendations.push({
      title: "Address the missing job requirements",
      detail: `The resume does not mention ${missingRequirements.slice(0, 4).join(", ")}${missingRequirements.length > 4 ? ` and ${missingRequirements.length - 4} more` : ""}. If you have this experience, add a truthful example in Skills, Projects, or Experience.`,
      priority: "High",
    });
  } else {
    recommendations.push({
      title: "Make your relevant skills easier to verify",
      detail: "The listed role skills appear in your text. Add a concise project or work example showing where you used them.",
      priority: "Good next step",
    });
  }
  const missingEvidence = evidenceSections.filter((section) => !presentEvidence.includes(section));
  if (missingEvidence.length) {
    recommendations.push({
      title: "Add clear evidence sections",
      detail: `Detected headings are missing for ${missingEvidence.join(", ")}. Add the section only when you have relevant details to support it.`,
      priority: "Improve clarity",
    });
  }
  if (missingKeywords.length) {
    recommendations.push({
      title: "Use the employer's language where it matches your experience",
      detail: `These frequent terms were not found: ${missingKeywords.slice(0, 5).join(", ")}. Reuse them only where they accurately describe your work.`,
      priority: "Improve relevance",
    });
  }
  if (!quantifiedClaims.length) {
    recommendations.push({
      title: "Show outcomes when you can substantiate them",
      detail: "Your resume text has no detected action-and-number result patterns. Add verified scope, time, quality, or impact measures if available; do not invent metrics.",
      priority: "Evidence",
    });
  }

  return {
    score,
    scoreLabel: score >= 8 ? "Strong text alignment" : score >= 6 ? "Good starting alignment" : score >= 4 ? "Some alignment to build on" : "Several gaps to review",
    requirements,
    matchedRequirements,
    missingRequirements,
    matchedRoleSkills,
    missingRoleSkills,
    matchedKeywords,
    missingKeywords,
    factors: factors.map((factor) => ({
      ...factor,
      score: Math.round(factor.score * 10) / 10,
      weightedPoints: Math.round(factor.score * factor.weight / 100 * 10) / 10,
    })),
    requirementsSource,
    roleSkillsInJd,
    jdKeywordCount: jdKeywords.length,
    presentEvidence,
    recommendations,
  };
}

function extractExperienceValues(text) {
  const values = [];
  if (!text) return values;

  const explicitPatterns = [
    /(min(?:imum)?|at\s+least|atleast|required|need(?:s|ed)?)\s*(?:experience|exp)?\s*[:\-]?\s*(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?)\b/gi,
    /(\d+(?:\.\d+)?)\s*(?:\+)?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)\b/gi,
    /(\d+(?:\.\d+)?)\s*(?:-|to|–|—)\s*(\d+(?:\.\d+)?)\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)\b/gi,
  ];

  for (const pattern of explicitPatterns) {
    for (const match of text.matchAll(pattern)) {
      const first = Number.parseFloat(match[1]);
      const second = match[2] ? Number.parseFloat(match[2]) : null;
      if (!Number.isNaN(first)) values.push(first);
      if (second !== null && !Number.isNaN(second)) values.push(second);
    }
  }

  return values.filter((value) => Number.isFinite(value) && value >= 0);
}

function summarizeExperienceYears(text, mode = "max") {
  const values = extractExperienceValues(text);
  if (!values.length) return 0;
  return mode === "min" ? Math.min(...values) : Math.max(...values);
}

function jobRequiresMoreExperienceThanResume(jobText, candidateExperienceYears) {
  if (!candidateExperienceYears && candidateExperienceYears !== 0) return false;

  const text = String(jobText || "");
  if (!text) return false;
  if (/\b(fresher|entry[- ]level|graduate trainee|junior|intern|0\s*[-+]?\s*years?\s*(?:experience|exp)?)\b/i.test(text)) {
    return false;
  }

  const hasExplicitExperienceRequirement = /\b(?:min(?:imum)?|at\s+least|atleast|required|need(?:s|ed)?)\b.*(?:experience|exp)|(?:experience|exp).*\b(?:min(?:imum)?|at\s+least|atleast|required|need(?:s|ed)?)\b|\b\d+(?:\.\d+)?\s*(?:\+)?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)\b|\b\d+(?:\.\d+)?\s*(?:-|to|–|—)\s*\d+(?:\.\d+)?\s*(?:years?|yrs?)\s*(?:of\s+)?(?:experience|exp)\b/i.test(text);
  if (!hasExplicitExperienceRequirement) return false;

  const minimumExperienceYears = summarizeExperienceYears(text, "min");
  return minimumExperienceYears > 0 && candidateExperienceYears < minimumExperienceYears;
}

function plainText(value) {
  if (!value) return "";
  const document = new DOMParser().parseFromString(value, "text/html");
  return (document.body.textContent || "").replace(/\s+/g, " ").trim();
}

function createJobRecord({ id, title, company, location, url, source, tags, description, date, jobType, remote }) {
  if (!title || !url) return null;
  try {
    const jobUrl = new URL(url);
    if (jobUrl.protocol !== "https:") return null;
    return {
      id: `${source}:${id || jobUrl.href}`,
      title: String(title).trim(),
      company: String(company || "Company not listed").trim(),
      location: String(location || (remote ? "Remote" : "Location not listed")).trim(),
      url: jobUrl.href,
      source,
      tags: Array.isArray(tags) ? tags.map((tag) => String(tag).trim()).filter(Boolean) : [],
      description: plainText(description).slice(0, 5000),
      date: date || "",
      jobType: jobType || "",
      remote: Boolean(remote),
    };
  } catch {
    return null;
  }
}

function normalizeArbeitnow(payload) {
  if (!Array.isArray(payload?.data)) throw new Error("The Arbeitnow feed returned an unexpected response.");
  return payload.data.map((job) => createJobRecord({
    id: job.slug,
    title: job.title,
    company: job.company_name,
    location: job.location,
    url: job.url,
    source: "Arbeitnow",
    tags: job.tags,
    description: job.description,
    date: job.created_at,
    jobType: Array.isArray(job.job_types) ? job.job_types.join(", ") : "",
    remote: job.remote,
  })).filter(Boolean);
}

function normalizeRemoteOK(payload) {
  if (!Array.isArray(payload)) throw new Error("The Remote OK feed returned an unexpected response.");
  return payload.filter((job) => job && (job.id || job.slug)).map((job) => createJobRecord({
    id: job.id || job.slug,
    title: job.position || job.title,
    company: job.company,
    location: job.location,
    url: job.url || job.apply_url || job.original,
    source: "Remote OK",
    tags: job.tags,
    description: job.description,
    date: job.date,
    jobType: job.job_type,
    remote: true,
  })).filter(Boolean);
}

function normalizeJobicy(payload) {
  if (!Array.isArray(payload?.jobs)) throw new Error("The Jobicy feed returned an unexpected response.");
  return payload.jobs.map((job) => createJobRecord({
    id: job.id,
    title: job.jobTitle,
    company: job.companyName,
    location: job.jobGeo,
    url: job.url,
    source: "Jobicy",
    tags: job.jobIndustry,
    description: job.jobDescription || job.jobExcerpt,
    date: job.pubDate,
    jobType: Array.isArray(job.jobType) ? job.jobType.join(", ") : "",
    remote: true,
  })).filter(Boolean);
}

async function fetchFeedJson(url, source, signal) {
  const response = await fetch(url, { signal, headers: { Accept: "application/json" } });
  if (!response.ok) throw new Error(`${source} returned HTTP ${response.status}.`);
  return response.json();
}

async function requestResumeAI(payload) {
  let response;
  try {
    response = await apiRequest("/api/resume-assistant", {
      method: "POST",
      body: JSON.stringify(payload),
    });
  } catch (error) {
    if (error instanceof TypeError) {
      throw new Error("Resume AI service is unreachable. Restart the app with “npm run dev” to start the frontend and API together.");
    }
    throw error;
  }
  let result;
  try {
    result = await response.json();
  } catch {
    throw new Error("Resume AI returned an unreadable response. Please try again.");
  }
  if (!response.ok) throw new Error(result.error || "Resume AI could not complete this request.");
  if (!result?.result || typeof result.result !== "object") {
    throw new Error("Resume AI returned an incomplete result. Please try again.");
  }
  return result.result;
}

async function loadPublicJobFeeds() {
  if (publicJobFeedCache && Date.now() - publicJobFeedCache.fetchedAt < JOB_FEED_CACHE_TTL) {
    return { ...publicJobFeedCache, cached: true };
  }

  const feedTasks = [
    ["Arbeitnow", async () => {
      const payload = await fetchFeedJson("https://www.arbeitnow.com/api/job-board-api?page=1", "Arbeitnow");
      return normalizeArbeitnow(payload);
    }],
    ["Remote OK", async () => {
      const payload = await fetchFeedJson("https://remoteok.com/api", "Remote OK");
      return normalizeRemoteOK(payload);
    }],
    ["Jobicy (APAC remote)", async () => {
      const payload = await fetchFeedJson("https://jobicy.com/api/v2/remote-jobs?count=200&geo=apac", "Jobicy");
      return normalizeJobicy(payload);
    }],
  ];
  const results = await Promise.allSettled(feedTasks.map(([, load]) => load()));
  const jobs = [];
  const errors = [];
  results.forEach((result, index) => {
    if (result.status === "fulfilled") jobs.push(...result.value);
    else errors.push(`${feedTasks[index][0]}: ${result.reason?.message || "Could not load listings."}`);
  });
  if (!jobs.length && errors.length) throw new Error(errors.join(" "));

  const uniqueJobs = [...new Map(jobs.map((job) => [job.url, job])).values()];
  const fetchedAt = Date.now();
  publicJobFeedCache = { jobs: uniqueJobs, errors, fetchedAt };
  return { ...publicJobFeedCache, cached: false };
}

function normalizeAdzuna(payload) {
  if (!Array.isArray(payload?.jobs)) throw new Error("India listings returned an unexpected response.");
  return payload.jobs.map((job) => createJobRecord(job)).filter(Boolean);
}

async function loadIndiaJobFeed(location) {
  const query = location ? `?${new URLSearchParams({ where: location })}` : "";
  const response = await apiRequest(`/api/jobs/india${query}`);
  const payload = await response.json();
  if (!response.ok) {
    const message = typeof payload.error === "string"
      ? payload.error.replace(/\bAdzuna\b/gi, "India job feed")
      : "India job search could not be completed.";
    throw new Error(message);
  }
  return {
    jobs: normalizeAdzuna(payload),
    fetchedAt: payload.fetchedAt || Date.now(),
    cached: payload.cached === true,
  };
}

async function readResumeFile(file) {
  if (!/\.(pdf|doc|docx|txt)$/i.test(file.name)) {
    throw new Error("Choose a PDF, DOC, DOCX, or TXT resume.");
  }
  if (file.size > 10 * 1024 * 1024) throw new Error("Choose a resume smaller than 10 MB.");
  if (/\.pdf$/i.test(file.name)) {
    const pdfjs = await import("pdfjs-dist");
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    const documentTask = pdfjs.getDocument({ data: await file.arrayBuffer() });
    try {
      const pdf = await documentTask.promise;
      const pages = [];
      for (let number = 1; number <= pdf.numPages; number += 1) {
        const page = await pdf.getPage(number);
        const content = await page.getTextContent();
        let pageText = "";
        let previousY = null;
        let previousEndX = null;
        for (const item of content.items) {
          if (!("str" in item) || !item.str) continue;
          const x = item.transform?.[4];
          const y = item.transform?.[5];
          if (typeof y === "number" && typeof previousY === "number" && Math.abs(y - previousY) > 3) {
            pageText = `${pageText.trimEnd()}\n`;
          } else if (pageText && typeof x === "number" && typeof previousEndX === "number" && x > previousEndX + 1 && !pageText.endsWith(" ")) {
            pageText += " ";
          }
          pageText += item.str;
          if (item.hasEOL) pageText += "\n";
          previousY = y;
          previousEndX = typeof x === "number" && typeof item.width === "number" ? x + item.width : x;
        }
        pages.push(pageText);
      }
      return pages.join("\n").trim();
    } finally {
      await documentTask.destroy();
    }
  }
  if (/\.(doc|docx)$/i.test(file.name)) {
    const mammothModule = await import("mammoth/mammoth.browser");
    const mammoth = mammothModule.default || mammothModule;
    return (await mammoth.extractRawText({ arrayBuffer: await file.arrayBuffer() })).value.trim();
  }
  return (await file.text()).trim();
}

function saveBlob(blob, filename) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}

function resumeTextToParagraphs(text) {
  return text.split(/\r?\n/).map((line) => line.trim()).filter(Boolean);
}

function normalizeResumeHeading(line) {
  return line
    .trim()
    .replace(/^#+\s*/, "")
    .replace(/^\*\*(.*)\*\*$/, "$1")
    .replace(/[*_`]/g, "")
    .replace(/[:：]\s*$/, "")
    .replace(/\s+/g, " ")
    .trim()
    .toLowerCase();
}

function escapeHtml(text) {
  return text.replace(/[&<>"']/g, (character) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "\"": "&quot;",
    "'": "&#39;",
  })[character]);
}

function normalizeHexColor(color, fallback = "#29483E") {
  return /^#[0-9a-f]{6}$/i.test(color) ? color : fallback;
}

function buildPrintableResume(title, text, headingColor) {
  const safeHeadingColor = normalizeHexColor(headingColor);
  const darkHeadingColor = safeHeadingColor;
  const headingNames = new Set(
    [...SECTIONS, ...Object.values(SECTION_HEADINGS).flat(), "JD Keywords to Review", "JD Skills to Verify"]
      .map(normalizeResumeHeading),
  );
  const content = [];
  let bullets = [];
  const flushBullets = () => {
    if (!bullets.length) return;
    content.push(`<ul>${bullets.map((item) => `<li>${escapeHtml(item)}</li>`).join("")}</ul>`);
    bullets = [];
  };

  resumeTextToParagraphs(text).forEach((line, index) => {
    const heading = normalizeResumeHeading(line);
    const bullet = line.match(/^[•*-]\s+(.+)$/);
    if (index === 0) {
      flushBullets();
      content.push(`<h1>${escapeHtml(line)}</h1>`);
    } else if (headingNames.has(heading)) {
      flushBullets();
      content.push(`<h2>${escapeHtml(line.replace(/^#+\s*/, "").replace(/[*_`]/g, "").replace(/[:：]\s*$/, ""))}</h2>`);
    } else if (bullet) {
      bullets.push(bullet[1]);
    } else {
      flushBullets();
      content.push(`<p>${escapeHtml(line)}</p>`);
    }
  });
  flushBullets();

  return `<!doctype html>
<html lang="en">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>${escapeHtml(title)}</title>
  <style>
    @page { size: A4; margin: 16mm 17mm; }
    * { box-sizing: border-box; }
    body { margin: 0; color: #24332f; font: 10.5pt/1.5 Arial, Helvetica, sans-serif; overflow-wrap: anywhere; }
    h1 { margin: 0 0 9pt; padding: 0 0 7pt; border-bottom: 2pt solid ${safeHeadingColor}; color: ${darkHeadingColor}; font-size: 22pt; line-height: 1.2; }
    h2 { margin: 15pt 0 6pt; padding-bottom: 3pt; border-bottom: .75pt solid ${safeHeadingColor}66; color: ${safeHeadingColor}; font-size: 12pt; line-height: 1.25; page-break-after: avoid; break-after: avoid; }
    p { margin: 0 0 5pt; }
    ul { margin: 0 0 7pt; padding-left: 19pt; }
    li { margin: 0 0 3pt; padding-left: 2pt; }
    @media screen { body { max-width: 210mm; margin: 20px auto; padding: 16mm 17mm; box-shadow: 0 2px 18px #0002; } }
  </style>
</head>
<body>${content.join("\n")}
<script>window.addEventListener("load", () => window.setTimeout(() => window.print(), 250));</script>
</body>
</html>`;
}

async function downloadDocx(title, text, template, sectionNames, accentColor, photoDataUrl) {
  const { BorderStyle, Document, HeadingLevel, ImageRun, Packer, Paragraph, ShadingType, TabStopType, Table, TableCell, TableRow, TextRun, WidthType } = await import("docx");
  const templateLayouts = {
    classic: { alignment: "left", font: "Arial", titleSize: 34, headingSize: 24, gap: 140, leftMargin: 900 },
    modern: { alignment: "left", font: "Arial", titleSize: 38, headingSize: 25, gap: 150, leftMargin: 900 },
    compact: { alignment: "left", font: "Arial", titleSize: 30, headingSize: 22, gap: 70, leftMargin: 720 },
    executive: { alignment: "center", font: "Arial", titleSize: 40, headingSize: 25, gap: 160, leftMargin: 1080 },
    sidebar: { alignment: "left", font: "Arial", titleSize: 34, headingSize: 24, gap: 120, leftMargin: 1080 },
    minimal: { alignment: "left", font: "Arial", titleSize: 32, headingSize: 22, gap: 180, leftMargin: 900 },
    bold: { alignment: "left", font: "Arial", titleSize: 42, headingSize: 27, gap: 150, leftMargin: 900 },
    elegant: { alignment: "center", font: "Georgia", titleSize: 38, headingSize: 24, gap: 170, leftMargin: 1080 },
    technical: { alignment: "left", font: "Arial", titleSize: 32, headingSize: 23, gap: 100, leftMargin: 900 },
    clean: { alignment: "left", font: "Arial", titleSize: 36, headingSize: 24, gap: 130, leftMargin: 900 },
    split: { alignment: "left", font: "Arial", titleSize: 36, headingSize: 24, gap: 120, leftMargin: 720 },
    timeline: { alignment: "left", font: "Arial", titleSize: 36, headingSize: 24, gap: 125, leftMargin: 900 },
    banner: { alignment: "left", font: "Arial", titleSize: 40, headingSize: 25, gap: 140, leftMargin: 900 },
    editorial: { alignment: "left", font: "Georgia", titleSize: 42, headingSize: 24, gap: 180, leftMargin: 1080 },
    infographic: { alignment: "left", font: "Arial", titleSize: 36, headingSize: 24, gap: 115, leftMargin: 900 },
    monochrome: { alignment: "left", font: "Arial", titleSize: 38, headingSize: 25, gap: 140, leftMargin: 900 },
    framed: { alignment: "left", font: "Georgia", titleSize: 38, headingSize: 24, gap: 150, leftMargin: 1080 },
    topline: { alignment: "left", font: "Arial", titleSize: 38, headingSize: 24, gap: 135, leftMargin: 900 },
    portfolio: { alignment: "left", font: "Arial", titleSize: 36, headingSize: 24, gap: 120, leftMargin: 720 },
    stacked: { alignment: "center", font: "Arial", titleSize: 38, headingSize: 24, gap: 130, leftMargin: 900 },
  };
  const layout = templateLayouts[template] || templateLayouts.classic;
  const headingColor = normalizeHexColor(accentColor).slice(1).toUpperCase();
  const photoSupported = RESUME_TEMPLATES.find((item) => item.id === template)?.headshot;
  const photoBytes = photoSupported && photoDataUrl ? getPhotoBytes(photoDataUrl) : null;
  const sectionHeadings = new Set(
    [
      ...sectionNames,
      ...Object.values(SECTION_HEADINGS).flat(),
      "JD Keywords to Review",
      "JD Skills to Verify",
    ].map(normalizeResumeHeading),
  );
  const lines = resumeTextToParagraphs(text);
  const sectionStart = lines.findIndex((line) => sectionHeadings.has(normalizeResumeHeading(line)));
  const headerLines = lines.slice(0, sectionStart < 0 ? 3 : sectionStart);
  const contentLines = sectionStart < 0 ? [] : lines.slice(sectionStart);
  const sections = [];
  let currentSection = null;
  contentLines.forEach((line) => {
    if (sectionHeadings.has(normalizeResumeHeading(line))) {
      currentSection = { title: line, lines: [] };
      sections.push(currentSection);
    } else if (currentSection) {
      currentSection.lines.push(line);
    } else {
      headerLines.push(line);
    }
  });
  const makeParagraph = (line, { isName = false, isSection = false, inSidebar = false } = {}) => {
    const isClassic = template === "classic";
    const bulletMatch = line.match(/^\s*[•*-]\s+/);
    const paragraphText = bulletMatch ? line.slice(bulletMatch[0].length) : line;
    const titleColor = headingColor;
    const sectionBorder = template === "clean"
      ? { bottom: { color: "D9E2D2", size: 4, space: 4, style: BorderStyle.SINGLE } }
      : ["sidebar", "timeline"].includes(template)
        ? { left: { color: accentColor.slice(1).toUpperCase(), size: 12, space: 5, style: BorderStyle.SINGLE } }
        : ["modern", "topline"].includes(template)
          ? { bottom: { color: accentColor.slice(1).toUpperCase(), size: 8, space: 5, style: BorderStyle.SINGLE } }
          : undefined;
    const frameBorder = { top: { color: accentColor.slice(1).toUpperCase(), size: 6, space: 6, style: BorderStyle.SINGLE }, bottom: { color: accentColor.slice(1).toUpperCase(), size: 6, space: 6, style: BorderStyle.SINGLE }, left: { color: accentColor.slice(1).toUpperCase(), size: 6, space: 6, style: BorderStyle.SINGLE }, right: { color: accentColor.slice(1).toUpperCase(), size: 6, space: 6, style: BorderStyle.SINGLE } };
    const [leftText, rightText] = paragraphText.split("\t");
    return new Paragraph({
      heading: isName ? HeadingLevel.TITLE : isSection ? HeadingLevel.HEADING_1 : undefined,
      bullet: bulletMatch && !isName && !isSection ? { level: 0 } : undefined,
      alignment: ["executive", "elegant", "stacked"].includes(template) && !isSection ? "center" : undefined,
      tabStops: rightText ? [{ type: TabStopType.RIGHT, position: ["sidebar", "split", "portfolio"].includes(template) ? 6200 : 9000 }] : undefined,
      indent: bulletMatch ? { left: 360, hanging: 180 } : inSidebar && template === "sidebar" ? { left: 120 } : undefined,
      border: isSection ? sectionBorder : template === "framed" ? frameBorder : isName && template === "topline" ? { top: { color: accentColor.slice(1).toUpperCase(), size: 18, space: 8, style: BorderStyle.SINGLE } } : undefined,
      shading: isName && isClassic ? { type: ShadingType.CLEAR, fill: "35434A" } : isName && template === "banner" ? { type: ShadingType.CLEAR, fill: accentColor.slice(1).toUpperCase() } : isSection && template === "infographic" ? { type: ShadingType.CLEAR, fill: "EEF3F7" } : undefined,
      children: [
        ...(isName && photoBytes ? [new ImageRun({ data: photoBytes, type: "jpg", transformation: { width: 72, height: 90 } })] : []),
        new TextRun({
          text: rightText ? leftText : paragraphText,
          bold: isName || isSection,
          color: isName && (isClassic || template === "banner") ? "FFFFFF" : isName && template === "monochrome" ? "111111" : isName || isSection ? titleColor : "1B2A22",
          font: layout.font,
          size: isName ? Math.max(layout.titleSize, 40) : isSection ? Math.max(layout.headingSize, 26) : 24,
        }),
        ...(rightText ? [new TextRun({ text: `\t${rightText}`, font: layout.font, size: 22 })] : []),
      ],
      keepNext: isSection,
      keepLines: true,
      spacing: { before: isSection ? 180 : 0, after: isSection ? 100 : layout.gap },
    });
  };
  const isSidebarSection = (section) => template === "portfolio"
    ? /^(projects?|certifications?)$/i.test(section.title)
    : /^(skills|education|certifications?|languages?|training)$/i.test(section.title);
  const makeSectionParagraphs = (section, inSidebar = false) => [
    makeParagraph(section.title, { isSection: true, inSidebar }),
    ...section.lines.map((line) => makeParagraph(line, { inSidebar })),
  ];
  const children = headerLines.map((line, index) => makeParagraph(line, { isName: index === 0 }));
  if (["sidebar", "split", "portfolio"].includes(template) && sections.length) {
    const sidebarSections = sections.filter(isSidebarSection);
    const mainSections = sections.filter((section) => !isSidebarSection(section));
    const noBorders = Object.fromEntries(["top", "bottom", "left", "right", "insideHorizontal", "insideVertical"].map((side) => [
      side,
      { style: BorderStyle.NONE, size: 0, color: "FFFFFF" },
    ]));
    const cellChildren = (items, inSidebar) => items.length
      ? items.flatMap((section) => makeSectionParagraphs(section, inSidebar))
      : [new Paragraph({ children: [] })];
    children.push(new Table({
      width: { size: 100, type: WidthType.PERCENTAGE },
      columnWidths: [2600, 6800],
      rows: [new TableRow({ children: [
        new TableCell({
          width: { size: 2600, type: WidthType.DXA },
          shading: { type: ShadingType.CLEAR, fill: template === "portfolio" ? "F2EBE5" : template === "split" ? "EEF3F7" : "E8EDEF" },
          children: cellChildren(sidebarSections, true),
        }),
        new TableCell({
          width: { size: 6800, type: WidthType.DXA },
          children: cellChildren(mainSections, false),
        }),
      ] })],
      borders: noBorders,
    }));
  } else {
    sections.forEach((section) => children.push(...makeSectionParagraphs(section)));
  }
  const document = new Document({
    sections: [{ properties: { page: { margin: { top: 720, right: layout.leftMargin, bottom: 720, left: layout.leftMargin } } }, children }],
    title,
  });
  saveBlob(await Packer.toBlob(document), `${title.toLowerCase().replace(/[^a-z0-9]+/g, "-")}.docx`);
}

function MetricCard({ label, value, note }) {
  return (
    <article className="ri-score-card">
      <span>{label}</span>
      <strong>{value === null || value === undefined || value === "" ? "—" : value}</strong>
      <small>{note}</small>
    </article>
  );
}

function ResumeUpload({ onRead, status, busy, error, compact = false, hasResume = false }) {
  const [isDragging, setIsDragging] = useState(false);

  const handleFile = async (file) => {
    if (!file) return;
    onRead(null, "Reading resume locally…", true, "");
    try {
      const text = await readResumeFile(file);
      if (!text) throw new Error("No readable text was found in that file.");
      onRead(text, `${file.name} · ${text.split(/\s+/).length} words extracted on this device.`, false, "");
    } catch (readError) {
      onRead(null, "", false, readError.message || "The resume could not be read.");
    }
  };

  const handleDrop = (event) => {
    event.preventDefault();
    setIsDragging(false);
    if (!busy) void handleFile(event.dataTransfer.files?.[0]);
  };

  return (
    <label
      className={`ri-upload${compact ? " compact" : ""}${isDragging ? " is-dragging" : ""}${busy ? " is-busy" : ""}`}
      onDragOver={(event) => { event.preventDefault(); if (!busy) setIsDragging(true); }}
      onDragLeave={(event) => {
        if (!event.currentTarget.contains(event.relatedTarget)) setIsDragging(false);
      }}
      onDrop={handleDrop}
    >
      <input
        type="file"
        accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain"
        aria-label={compact ? hasResume ? "Replace resume" : "Upload resume" : "Choose a resume file"}
        disabled={busy}
        onChange={(event) => { const file = event.target.files?.[0]; event.currentTarget.value = ""; void handleFile(file); }}
      />
      {compact
        ? <span className="ri-upload-compact-icon"><FileUp size={18} strokeWidth={1.8} aria-hidden="true" /></span>
        : <span className="ri-upload-icon"><FileUp size={27} strokeWidth={1.7} aria-hidden="true" /></span>}
      <span className="ri-upload-content">
        <strong>
          {busy ? "Reading your resume…" : compact
            ? hasResume ? "Replace resume" : "Upload resume"
            : isDragging
              ? "Drop to upload your resume"
              : "Drop your resume here"}
        </strong>
        {compact && <span className="ri-upload-compact-hint">{busy ? "Please wait while your file is processed" : "PDF, DOC, DOCX or TXT"}</span>}
        {!compact && <span className="ri-upload-browse">{busy ? "Please wait…" : "Browse files"}</span>}
        {!compact && <small>PDF, DOC, DOCX, or TXT · up to 10 MB</small>}
        {status && <span className="ri-upload-status" role="status">{status}</span>}
        {error && <span className="ri-error" role="alert">{error}</span>}
      </span>
    </label>
  );
}

function JobSearch({ analysis, resumeText = "" }) {
  const [keywords, setKeywords] = useState("");
  const [keywordsEdited, setKeywordsEdited] = useState(false);
  const [locationMode, setLocationMode] = useState("any");
  const [useAIMatching, setUseAIMatching] = useState(false);
  const candidateExperienceYears = useMemo(() => summarizeExperienceYears(resumeText, "max"), [resumeText]);
  const [location, setLocation] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState("");
  const [aiError, setAiError] = useState("");
  const [feedErrors, setFeedErrors] = useState([]);
  const [results, setResults] = useState([]);
  const [searchInfo, setSearchInfo] = useState(null);
  const [visibleCount, setVisibleCount] = useState(12);

  const matchesLocation = (job, requestedLocation) => {
    const normalizedLocation = requestedLocation.trim().toLowerCase();
    if (includesTerm(job.location, requestedLocation)) return true;
    if (!job.remote) return false;
    if (/\b(worldwide|anywhere|global|all locations)\b/i.test(job.location)) return true;
    return normalizedLocation === "india" && /\bapac\b/i.test(job.location);
  };

  useEffect(() => {
    if (!keywordsEdited && analysis) {
      setKeywords(analysis.foundSkills.slice(0, 12).join(", "));
    }
  }, [analysis, keywordsEdited]);

  useEffect(() => {
    if (resumeText.length > 12000) setUseAIMatching(false);
  }, [resumeText]);

  const runSearch = async () => {
    setError("");
    const terms = [...new Set(keywords.split(/[,;\n]+/).map((term) => term.trim()).filter(Boolean))];
    if (!terms.length && !(useAIMatching && resumeText.trim().length >= 80 && resumeText.length <= 12000)) {
      setError("Add at least one keyword, or upload a resume with recognizable skills to prefill this field.");
      return;
    }
    if (locationMode === "specific" && !location.trim()) {
      setError("Enter a country or city, or choose another location option.");
      return;
    }

    setIsLoading(true);
    setResults([]);
    setFeedErrors([]);
    setSearchInfo(null);
    setVisibleCount(12);
    try {
      const locationFilter = locationMode === "specific" ? location.trim() : "";
      const [publicResult, indiaResult] = await Promise.allSettled([
        loadPublicJobFeeds(),
        loadIndiaJobFeed(locationFilter),
      ]);
      const jobs = [];
      const errors = [];
      let fetchedAt = Date.now();
      let cached = false;
      if (publicResult.status === "fulfilled") {
        jobs.push(...publicResult.value.jobs);
        errors.push(...publicResult.value.errors);
        fetchedAt = publicResult.value.fetchedAt;
        cached = publicResult.value.cached;
      } else {
        errors.push(`Public job feeds: ${publicResult.reason?.message || "Could not load listings."}`);
      }
      if (indiaResult.status === "fulfilled") {
        jobs.push(...indiaResult.value.jobs);
        fetchedAt = Math.max(fetchedAt, indiaResult.value.fetchedAt);
        cached = cached && indiaResult.value.cached;
      } else {
        errors.push(`India listings: ${indiaResult.reason?.message || "Could not load listings."}`);
      }
      if (!jobs.length && errors.length) throw new Error(errors.join(" "));
      const keywordMatches = jobs.map((job) => ({
        ...job,
        matchedTerms: terms.filter((term) => includesTerm(`${job.title} ${job.company} ${job.location} ${job.tags.join(" ")} ${job.description}`, term)),
      })).filter((job) => {
        if (locationMode === "remote" && !job.remote) return false;
        if (locationMode === "specific") {
          if (job.source === "Adzuna") return true;
          if (!matchesLocation(job, location)) return false;
        }
        if (jobRequiresMoreExperienceThanResume(`${job.title} ${job.description} ${job.tags.join(" ")}`, candidateExperienceYears)) return false;
        return true;
      });
      let matching;
      let matchingMode = "keyword";
      setAiError("");
      if (useAIMatching && resumeText.trim().length >= 80 && resumeText.length <= 12000) {
        const candidates = [...keywordMatches]
          .sort((first, second) => second.matchedTerms.length - first.matchedTerms.length || (Date.parse(second.date) || 0) - (Date.parse(first.date) || 0))
          .slice(0, 30);
        try {
          if (!candidates.length) {
            matching = [];
            matchingMode = "keyword";
          } else {
          const aiResult = await requestResumeAI({
            action: "match-jobs",
            resumeText,
            jobs: candidates.map((job, index) => ({
              id: `job-${index}`,
              title: job.title,
              company: job.company,
              location: job.location,
              remote: job.remote,
              tags: job.tags.slice(0, 15),
              description: job.description.slice(0, 1200),
            })),
          });
          const candidateById = new Map(candidates.map((job, index) => [`job-${index}`, job]));
          matching = aiResult.matches.map((match) => {
            const job = candidateById.get(match.jobId);
            return job ? { ...job, aiMatch: match } : null;
          }).filter(Boolean).sort((first, second) => second.aiMatch.score - first.aiMatch.score);
          matchingMode = "AI-assisted text relevance";
          }
        } catch (matchError) {
          setAiError(`AI matching could not be completed: ${matchError.message} Showing keyword matches instead.`);
          matching = keywordMatches
            .filter((job) => job.matchedTerms.length > 0)
            .sort((first, second) => second.matchedTerms.length - first.matchedTerms.length || (Date.parse(second.date) || 0) - (Date.parse(first.date) || 0));
        }
      } else {
        matching = keywordMatches
          .filter((job) => job.matchedTerms.length > 0)
          .sort((first, second) => second.matchedTerms.length - first.matchedTerms.length || (Date.parse(second.date) || 0) - (Date.parse(first.date) || 0));
      }
      setResults(matching);
      setFeedErrors(errors);
      setSearchInfo({
        fetchedAt,
        cached,
        scanned: jobs.length,
        terms,
        matchingMode,
      });
    } catch (searchError) {
      setError(searchError.message || "Could not load public job listings. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };
  const handleSearch = (event) => {
    event.preventDefault();
    void runSearch();
  };

  return (
    <div className="ri-job-search">
      <section className="ri-card ri-job-search-intro">
        <div className="ri-card-title-row">
          <span className="ri-card-icon target"><Search size={18} /></span>
          <div><h2>Find current listings, including jobs in India</h2><p>Upload a resume above to prefill keywords, or enter them yourself. Resume text and keywords stay in your browser; an optional country/city filter helps find local listings.</p></div>
        </div>
        <form className="ri-job-search-form" onSubmit={handleSearch}>
          <label className="ri-job-keywords">Keywords from your resume or profile
            <input value={keywords} onChange={(event) => { setKeywords(event.target.value); setKeywordsEdited(true); }} placeholder={analysis?.foundSkills.length ? analysis.foundSkills.slice(0, 6).join(", ") : "e.g. project management, nursing, Python"} />
            <small>{analysis ? `${analysis.foundSkills.length} catalog terms detected in extracted text. Edit this list before searching.` : "Upload a resume to prefill detected terms, or type terms separated by commas."}</small>
          </label>
          {resumeText.trim().length >= 80 && resumeText.length <= 12000 && <label className="ri-ai-consent"><input type="checkbox" checked={useAIMatching} onChange={(event) => setUseAIMatching(event.target.checked)} /><span><strong>Use AI to rank relevant jobs</strong><small>When enabled, your resume and up to 30 public listing summaries are sent to the AI provider for this search. You can leave this off for keyword matching.</small></span></label>}
          {resumeText.length > 12000 && <p className="ri-job-warning" role="status">This resume exceeds the 12,000-character AI limit. Shorten it before using AI; keyword job search is still available.</p>}
          <div className="ri-job-location-row">
            <label>Location
              <select value={locationMode} onChange={(event) => setLocationMode(event.target.value)}>
                <option value="any">Any location</option>
                <option value="remote">Remote only</option>
                <option value="specific">Country or city</option>
              </select>
            </label>
            {locationMode === "specific" && <label>Country or city
              <input value={location} onChange={(event) => setLocation(event.target.value)} placeholder="e.g. India, Mumbai, London" />
            </label>}
            <button type="submit" className="primary-button" disabled={isLoading}><Search size={16} />{isLoading ? (useAIMatching ? "Finding AI matches…" : "Searching feeds…") : "Find jobs"}</button>
          </div>
          {error && <p className="ri-job-error" role="alert">{error}</p>}
          {aiError && <p className="ri-job-warning" role="status">{aiError}</p>}
        </form>
      </section>

      {searchInfo && <>
        <div className="ri-job-results-heading">
          <div><span className="eyebrow">JOB RESULTS</span><h2>{results.length} listings matched</h2><p>{searchInfo.matchingMode === "AI-assisted text relevance" ? "AI ranked resume-to-listing text relevance. This is not an ATS score or hiring prediction." : `Matched one or more keywords: ${searchInfo.terms.join(", ")}. Keyword matches only—not a job-fit assessment.`}</p></div>
          <button type="button" className="secondary-button" onClick={() => void runSearch()} disabled={isLoading}>Search again</button>
        </div>
        <div className="ri-job-feed-note">
          <span>Checked {searchInfo.scanned} listings{searchInfo.cached ? " from the one-hour browser cache" : ""}</span>
          <span>{new Date(searchInfo.fetchedAt).toLocaleString()}</span>
        </div>
        {feedErrors.map((feedError) => <p className="ri-job-warning" role="status" key={feedError}>{feedError}</p>)}
        {results.length ? <div className="ri-live-job-list">{results.slice(0, visibleCount).map((job) => (
          <article className="ri-live-job-card" key={job.id}>
            <div className="ri-live-job-top">
              <div><h3>{job.title}</h3><p>{job.company} · {job.location}</p></div>
              <span className={job.aiMatch ? "ri-ai-match-score" : "ri-job-date"}>{job.aiMatch ? `AI relevance · ${job.aiMatch.score}/100` : job.date ? new Date(job.date).toLocaleDateString() : "Date not listed"}</span>
            </div>
            {job.aiMatch ? <div className="ri-ai-match-notes"><InfoRows label="Why it may fit" values={job.aiMatch.reasons} empty="" />{job.aiMatch.considerations.length > 0 && <InfoRows label="Check before applying" values={job.aiMatch.considerations} empty="" />}</div> : null}
            <div className="ri-job-tags">{job.matchedTerms.map((term) => <span key={term}>{term}</span>)}</div>
            {job.tags.length > 0 && <p className="ri-job-original-tags">Listing tags: {job.tags.slice(0, 8).join(" · ")}</p>}
            <p className="ri-live-job-description">{job.description ? `${job.description.slice(0, 360)}${job.description.length > 360 ? "…" : ""}` : "Description not provided in the feed."}</p>
            <div className="ri-live-job-footer"><span>{[job.remote ? "Remote" : "", job.jobType].filter(Boolean).join(" · ") || "See listing for work arrangement"}</span><a href={job.url} target="_blank" rel="noopener noreferrer">Open listing <ExternalLink size={14} /></a></div>
          </article>
        ))}</div> : <div className="ri-empty-filter">No listing in these feed results matched your keywords and location. Try fewer keywords, choose “Any location,” or search again later.</div>}
        {results.length > visibleCount && <button type="button" className="secondary-button ri-load-more" onClick={() => setVisibleCount((count) => count + 12)}>Show more matching listings</button>}
        <p className="ri-disclaimer">India listings may appear alongside worldwide/APAC remote roles, which are not necessarily local-office positions. Available listings are not the entire job market. Availability, eligibility, location and application status can change. Verify details on the employer’s original listing before applying.</p>
      </>}
    </div>
  );
}

function ResumeIntelligence({ user }) {
  const location = useLocation();
  const route = location.pathname.split("/").filter(Boolean)[1] || "dashboard";
  const storageKey = (key) => `${key}:${encodeURIComponent(user.id)}`;
  const profileStorageKey = storageKey(PROFILE_KEY);
  const resumeStorageKey = storageKey(RESUME_KEY);
  const tailorHeadingColorStorageKey = storageKey("skillai-resume-tailor-heading-color");
  const pageByRoute = {
    dashboard: ["Resume Dashboard", "Review the content extracted from your resume and choose a useful next step.", BarChart3],
    analyzer: ["Resume Analyzer", "Review text extracted from your resume and verify every finding.", FileText],
    builder: ["Resume Builder", "Create a clear, single-column resume from details you provide.", ListChecks],
    "match-tailor": ["Optimize", "Match a job description against your resume, then create a role-focused draft.", Target],
    optimizer: ["Optimize", "Match a job description against your resume, then create a role-focused draft.", Target],
    "job-match": ["Job Match", "Find live listings and optionally rank them against your resume with AI.", BriefcaseBusiness],
    tailor: ["Optimize", "Match a job description against your resume, then create a role-focused draft.", Target],
    "career-analysis": ["Career Analysis", "Review role skills and describe project evidence.", GraduationCap],
    "skill-gaps": ["Career Analysis", "Review role skills and describe project evidence.", GraduationCap],
    "project-analyzer": ["Career Analysis", "Review role skills and describe project evidence.", GraduationCap],
    profile: ["Career Profile", "Your reusable professional profile, grounded in your resume.", UserRound],
  };
  const [resumeText, setResumeText] = useState(() => window.localStorage.getItem(resumeStorageKey) || "");
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isReading, setIsReading] = useState(false);
  const [profile, setProfile] = useState(() => readStored(profileStorageKey, {}));
  const [notice, setNotice] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [matchTailorTab, setMatchTailorTab] = useState(route === "tailor" ? "tailor" : "match");
  const [careerAnalysisTab, setCareerAnalysisTab] = useState(route === "project-analyzer" ? "project" : "skills");
  const [tailorHeadingColor, setTailorHeadingColor] = useState(
    () => readStored(tailorHeadingColorStorageKey, "#29483E"),
  );
  const [aiLoading, setAiLoading] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiResults, setAiResults] = useState({});
  const [project, setProject] = useState({ name: "", description: "", github: "", liveUrl: "", documentation: "", technologies: "" });

  useEffect(() => {
    setAiError("");
  }, [route]);

  useEffect(() => {
    if (route === "optimizer") setMatchTailorTab("match");
    if (route === "tailor") setMatchTailorTab("tailor");
    if (route === "skill-gaps") setCareerAnalysisTab("skills");
    if (route === "project-analyzer") setCareerAnalysisTab("project");
  }, [route]);

  const analysis = useMemo(() => scanResume(resumeText), [resumeText]);
  const role = ROLES.find((item) => item.name === targetRole) || null;
  const jobMatchReport = useMemo(
    () => buildJobMatchReport(resumeText, jobDescription, role),
    [resumeText, jobDescription, role],
  );
  const jobSkills = useMemo(() => SKILL_CATALOG.filter((skill) => includesTerm(jobDescription, skill)), [jobDescription]);
  const matchedJobSkills = jobSkills.filter((skill) => includesTerm(resumeText, skill));
  const missingJobSkills = jobSkills.filter((skill) => !includesTerm(resumeText, skill));
  const roleMatches = ROLES.map((item) => {
    const matches = item.skills.filter((skill) => includesTerm(resumeText, skill));
    return { ...item, matches, missing: item.skills.filter((skill) => !matches.includes(skill)) };
  }).sort((first, second) => second.matches.length - first.matches.length);
  const skillSectors = analysis
    ? SECTORS.map((sector) => ({
      name: sector,
      count: [...new Set(ROLES.filter((item) => item.sector === sector).flatMap((item) => item.skills))]
        .filter((skill) => analysis.foundSkills.includes(skill)).length,
    })).filter((sector) => sector.count > 0)
      .sort((first, second) => second.count - first.count || first.name.localeCompare(second.name))
    : [];
  const sectionCount = Object.keys(SECTION_HEADINGS).length;
  const sectionCoverage = analysis ? analysis.presentSections.length / sectionCount : 0;
  const targetRoleMatch = roleMatches.find((item) => item.name === targetRole);
  const handleResumeRead = (text, status, busy, error) => {
    setUploadStatus(status);
    setIsReading(busy);
    setUploadError(error);
    if (text) {
      setResumeText(text);
      window.localStorage.setItem(resumeStorageKey, text);
      const nextProfile = { ...profile, resumeText: text, source: "uploaded resume" };
      setProfile(nextProfile);
      writeStored(profileStorageKey, nextProfile);
      setAiResults({});
      setAiError("");
      setNotice("Resume text saved locally on this device.");
    }
  };

  const updateProfile = (field, value) => {
    const next = { ...profile, [field]: value };
    setProfile(next);
    writeStored(profileStorageKey, next);
  };

  const clearResume = () => {
    window.localStorage.removeItem(resumeStorageKey);
    const nextProfile = { ...profile };
    delete nextProfile.resumeText;
    delete nextProfile.source;
    setProfile(nextProfile);
    writeStored(profileStorageKey, nextProfile);
    setResumeText("");
    setUploadStatus("");
    setUploadError("");
    setAiResults({});
    setAiError("");
    setNotice("Resume text removed from this browser.");
  };

  const runAI = async (action, details = {}) => {
    if (resumeText.trim().length < 80) {
      setAiError("Add a resume with at least 80 readable characters before using resume AI.");
      return;
    }
    if (resumeText.length > 12000) {
      setAiError("Resume AI supports up to 12,000 characters. Shorten the resume before trying again.");
      return;
    }
    setAiError("");
    setAiLoading(action);
    setAiResults((current) => ({ ...current, [action]: null }));
    try {
      const result = await requestResumeAI({
        action,
        resumeText,
        ...details,
      });
      let nextResult = result;
      if (action === "tailor") {
        const tailored = addMissingSkillsToResumeDraft(result.draft, missingJobSkills);
        nextResult = { ...result, ...tailored };
      }
      setAiResults((current) => ({ ...current, [action]: nextResult }));
    } catch (error) {
      setAiError(error.message || "Resume AI could not complete this request. Please try again.");
    } finally {
      setAiLoading("");
    }
  };

  const applyTailoredDraft = () => {
    const draft = aiResults.tailor?.draft;
    if (!draft) return;
    if (!window.confirm("Replace your current resume text with this AI draft? This cannot be undone from Resume Intelligence.")) return;
    handleResumeRead(draft, "AI-tailored draft saved as your current resume text on this device.", false, "");
  };

  const downloadTailoredDraft = async () => {
    const draft = aiResults.tailor?.draft;
    if (!draft) return;
    setAiError("");
    setAiLoading("tailor-download");
    try {
      const roleName = targetRole || "Tailored";
      await downloadDocx(`${roleName} Resume`, draft, "classic", SECTIONS, tailorHeadingColor);
    } catch (error) {
      setAiError(error.message || "The tailored resume could not be downloaded. Please try again.");
    } finally {
      setAiLoading("");
    }
  };

  const downloadTailoredPdf = () => {
    const draft = aiResults.tailor?.draft;
    if (!draft) return;
    setAiError("");
    const title = `${targetRole || "Tailored"} Resume`;
    const printWindow = window.open("", "_blank");
    if (!printWindow) {
      setAiError("Your browser blocked the PDF window. Allow pop-ups for this site, then try Download PDF again.");
      return;
    }

    try {
      printWindow.opener = null;
      printWindow.document.open();
      printWindow.document.write(buildPrintableResume(title, draft, tailorHeadingColor));
      printWindow.document.close();
    } catch (error) {
      printWindow.close();
      setAiError(error.message || "The PDF preview could not be prepared. Please try again.");
    }
  };

  const exportResume = async (format, text = resumeText, template = "classic", sectionNames = SECTIONS, accentColor = "#A8401A", photoDataUrl = "") => {
    if (!text.trim()) {
      setNotice("Add or upload resume content before exporting.");
      return;
    }
    if (format === "docx") {
      await downloadDocx("SkillAI Resume", text, template, sectionNames, accentColor, photoDataUrl);
      return;
    }
    const cleanupPrintMode = () => document.body.classList.remove("ri-print-resume");
    window.addEventListener("afterprint", cleanupPrintMode, { once: true });
    document.body.classList.add("ri-print-resume");
    try {
      window.print();
      window.setTimeout(cleanupPrintMode, 2000);
    } catch (error) {
      window.removeEventListener("afterprint", cleanupPrintMode);
      cleanupPrintMode();
      throw error;
    }
  };

  const [title, description, Icon] = pageByRoute[route] || pageByRoute.dashboard;
  const isMatchTailorRoute = ["match-tailor", "optimizer", "tailor"].includes(route);
  const isCareerAnalysisRoute = ["career-analysis", "skill-gaps", "project-analyzer"].includes(route);

  return (
    <main className="page-shell ri-page">
      <div className="wrap ri-layout">
        <aside className="ri-sidebar">
          <div className="ri-sidebar-brand"><span><FileText size={19} /></span><div><strong>Resume Intelligence</strong><small>Career workspace</small></div></div>
          {Object.entries({
            RESUME: [["dashboard", "Resume Dashboard"], ["analyzer", "Resume Analyzer"], ["builder", "Resume Builder"]],
            OPTIMIZATION: [["match-tailor", "Optimize"], ["job-match", "Job Match"]],
            "CAREER INTELLIGENCE": [["career-analysis", "Career Analysis"], ["profile", "Career Profile"]],
          }).map(([group, links]) => (
            <div className="ri-sidebar-group" key={group}>
              <span>{group}</span>
              {links.map(([slug, label]) => (
                <Link key={slug} to={`/resume/${slug}`} className={`ri-sidebar-link${route === slug || (slug === "match-tailor" && ["optimizer", "tailor"].includes(route)) || (slug === "career-analysis" && ["skill-gaps", "project-analyzer"].includes(route)) ? " active" : ""}`}>{label}<ChevronRight size={14} /></Link>
              ))}
            </div>
          ))}
          <div className="ri-sidebar-privacy"><ShieldCheck size={16} /><span>Your resume stays here unless you choose an AI action.</span></div>
        </aside>

        <section className="ri-content">
          <header className={`ri-page-heading${route === "dashboard" ? " ri-dashboard-page-heading" : ""}`}>
            {route === "dashboard" ? (
              <div className="ri-dashboard-welcome">
                <div className="ri-dashboard-title-copy">
                  <span className="eyebrow">CAREER WORKSPACE</span>
                  <h1>Resume overview</h1>
                  <p>Your resume and next steps, all in one place.</p>
                </div>
                <span className={`ri-dashboard-file-state${resumeText ? " ready" : ""}`}><i />{resumeText ? "Resume added" : "No resume yet"}</span>
              </div>
            ) : (
              <div><span className="eyebrow">CAREER WORKSPACE / RESUME</span><h1><Icon size={25} />{title}</h1><p>{description}</p></div>
            )}
            {route !== "builder" && route !== "dashboard" && <Link to="/resume/builder" className="secondary-button">{resumeText ? "Edit resume" : "Build a resume"} <ArrowRight size={16} /></Link>}
          </header>

          {route === "dashboard" && (
            <section className="ri-dashboard-metrics" aria-label="Resume summary">
              <article><span className="ri-dashboard-metric-icon"><FileText size={17} /></span><div><small>Words</small><strong>{analysis ? analysis.wordCount.toLocaleString() : "—"}</strong><span>In your resume</span></div></article>
              <article><span className="ri-dashboard-metric-icon skills"><Target size={17} /></span><div><small>Recognized skills</small><strong>{analysis ? analysis.foundSkills.length : "—"}</strong><span>Catalog terms found</span></div></article>
              <article><span className="ri-dashboard-metric-icon sections"><ListChecks size={17} /></span><div><small>Sections found</small><strong>{analysis ? `${analysis.presentSections.length}/${sectionCount}` : "—"}</strong><span>Standard headings</span></div></article>
              <article><span className="ri-dashboard-metric-icon versions"><UserRound size={17} /></span><div><small>Contact details</small><strong>{[profile.phone, profile.email, profile.linkedin, profile.github].filter(Boolean).length}</strong><span>In your profile</span></div></article>
            </section>
          )}

          {route === "dashboard" && (
            <section className="ri-dashboard-top-grid" aria-label="Resume dashboard shortcuts">
              <article className="ri-dashboard-resume-card">
                <div className="ri-dashboard-card-heading">
                  <span className="ri-card-icon"><FileText size={18} /></span>
                  <div><h2>{resumeText ? "Your resume is ready" : "Add your resume"}</h2><p>{resumeText ? `${analysis.wordCount.toLocaleString()} words saved in this browser` : "Upload a file or create one to start."}</p></div>
                </div>
                <div className="ri-dashboard-top-actions">
                  <ResumeUpload onRead={handleResumeRead} status={uploadStatus} busy={isReading} error={uploadError} compact hasResume={Boolean(resumeText)} />
                  <Link to="/resume/builder" className="secondary-button"><ListChecks size={16} />Build resume</Link>
                </div>
              </article>
              <aside className="ri-dashboard-quick-card">
                <div><span className="ri-card-icon"><Sparkles size={18} /></span><div><h2>Go to</h2></div></div>
                <Link to="/resume/analyzer"><span><FileText size={16} />Review resume</span><ChevronRight size={16} /></Link>
                <Link to="/resume/match-tailor"><span><Target size={16} />Optimize</span><ChevronRight size={16} /></Link>
              </aside>
            </section>
          )}

          {notice && <div className="ri-notice" role="status"><Check size={16} />{notice}</div>}
          {aiError && route !== "job-match" && <p className="ri-job-error" role="alert">{aiError}</p>}

          {route === "analyzer" ? (
            <section id={route === "dashboard" ? "resume-upload" : undefined} className={`ri-upload-panel${resumeText ? " has-resume" : " is-empty"}`}>
              <div className="ri-upload-copy">
                <span className="ri-upload-kicker">{resumeText ? "RESUME READY" : "START WITH YOUR RESUME"}</span>
                <strong>{resumeText ? "Your resume is ready to review" : "Bring your experience into focus"}</strong>
                <p>{resumeText ? "Review the extracted text before using career tools. Your file stays on this device unless you choose an AI action." : "Upload an existing resume and we’ll extract its text locally, so you can review it before using career tools."}</p>
                <span className="ri-upload-privacy"><ShieldCheck size={15} /> Stored in this browser · sent for AI review only when you choose an AI action</span>
                {resumeText && <button type="button" className="ri-clear-button" onClick={clearResume}><Trash2 size={15} />Remove saved resume</button>}
              </div>
              <ResumeUpload onRead={handleResumeRead} status={uploadStatus} busy={isReading} error={uploadError} />
            </section>
          ) : route !== "dashboard" && route !== "builder" ? (
            <section className={`ri-resume-status${resumeText ? " has-resume" : " is-empty"}`}>
              <span className={`ri-status-icon${resumeText ? " ready" : ""}`} aria-hidden="true">
                {resumeText ? <FileCheck2 size={20} strokeWidth={1.8} /> : <FileUp size={20} strokeWidth={1.8} />}
              </span>
              <span className="ri-resume-status-copy">
                <strong>{resumeText ? "Resume ready" : "No resume added yet"}</strong>
                <small>{resumeText ? "Saved in this browser and ready for your career tools." : "Upload a resume to unlock analysis and matching tools."}</small>
              </span>
              {route === "job-match" && <ResumeUpload onRead={handleResumeRead} status={uploadStatus} busy={isReading} error={uploadError} compact hasResume={Boolean(resumeText)} />}
              {route !== "builder" && route !== "job-match" && <Link to="/resume/analyzer">{resumeText ? "Review resume" : "Add resume"} <ArrowRight size={16} /></Link>}
            </section>
          ) : null}

          {route === "dashboard" && (
            <section className="ri-dashboard-grid">
              <div className="ri-dashboard-main-column">
                <div className="ri-analytics-heading"><div><span className="eyebrow">AT A GLANCE</span><h2>Resume insights</h2></div><p>Counts from your resume text</p></div>
                <section className="ri-dashboard-charts">
                  <article className="ri-dashboard-widget ri-dashboard-coverage">
                    <div className="ri-dashboard-widget-heading"><div><h2>Sections</h2><p>Standard headings found in your text</p></div><Link to="/resume/analyzer" aria-label="Review resume headings"><ArrowRight size={16} /></Link></div>
                    {analysis ? (
                      <div className="ri-coverage-content">
                        <svg className="ri-coverage-chart" viewBox="0 0 120 120" role="img" aria-label={`${analysis.presentSections.length} of ${sectionCount} standard headings detected`}>
                          <circle cx="60" cy="60" r="46" className="ri-coverage-track" />
                          <circle cx="60" cy="60" r="46" className="ri-coverage-value" strokeDasharray={`${289 * sectionCoverage} ${289 * (1 - sectionCoverage)}`} transform="rotate(-90 60 60)" />
                          <text x="60" y="57" className="ri-coverage-number">{analysis.presentSections.length}/{sectionCount}</text>
                          <text x="60" y="75" className="ri-coverage-label">headings</text>
                        </svg>
                        <div className="ri-coverage-details">
                          <strong>{analysis.presentSections.length} detected</strong>
                          <span>{analysis.missingSections.length} not found in text</span>
                          <small>Text check only</small>
                          <div className="ri-section-key" aria-label="Detected headings">
                            {analysis.presentSections.map((section) => <span key={section}>{section.charAt(0).toUpperCase() + section.slice(1)}</span>)}
                          </div>
                        </div>
                      </div>
                    ) : <div className="ri-chart-empty"><FileText size={18} /><span>Add a resume to see detected sections.</span></div>}
                  </article>
                  <article className="ri-dashboard-widget ri-dashboard-skills">
                    <div className="ri-dashboard-widget-heading"><div><h2>Skills by field</h2><p>Recognized terms in your resume</p></div><Link to="/resume/profile" aria-label="Review detected skills"><ArrowRight size={16} /></Link></div>
                    {analysis && skillSectors.length ? (
                      <div className="ri-sector-chart" role="img" aria-label={`Detected skill terms grouped by field: ${skillSectors.map(({ name, count }) => `${name}, ${count}`).join("; ")}`}>
                        {skillSectors.slice(0, 5).map(({ name, count }) => (
                          <div className="ri-sector-row" key={name}>
                            <span title={name}>{name}</span>
                            <span className="ri-sector-track"><i style={{ width: `${Math.max(8, count / Math.max(...skillSectors.map((item) => item.count)) * 100)}%` }} /></span>
                            <strong>{count}</strong>
                          </div>
                        ))}
                      </div>
                    ) : <div className="ri-chart-empty"><Target size={18} /><span>{analysis ? "No catalog skill terms detected yet." : "Add a resume to see detected skill terms."}</span></div>}
                  </article>
                  <article className="ri-dashboard-widget ri-dashboard-writing-chart">
                    <div className="ri-dashboard-widget-heading"><div><h2>Writing snapshot</h2><p>Bullet and number patterns</p></div><Link to="/resume/analyzer" aria-label="Review detected writing patterns"><ArrowRight size={16} /></Link></div>
                    {analysis ? (
                      <div className="ri-writing-chart-content">
                        <div className="ri-writing-chart-main">
                          {analysis.bullets.length ? (
                            <>
                              <div className="ri-writing-chart-total"><strong>{analysis.bullets.length}</strong><span>bullet lines</span></div>
                              <div className="ri-writing-chart-bar" role="img" aria-label={`${analysis.actionBullets.length} of ${analysis.bullets.length} bullet lines begin with a verb from a limited built-in list; ${analysis.bullets.length - analysis.actionBullets.length} did not match that list`}>
                                <span className="ri-writing-chart-action" style={{ width: `${(analysis.actionBullets.length / analysis.bullets.length) * 100}%` }} />
                                <span className="ri-writing-chart-other" style={{ width: `${((analysis.bullets.length - analysis.actionBullets.length) / analysis.bullets.length) * 100}%` }} />
                              </div>
                              <div className="ri-writing-chart-legend">
                                <span><i className="action" />{analysis.actionBullets.length} start with a listed action verb</span>
                                <span><i className="other" />{analysis.bullets.length - analysis.actionBullets.length} do not</span>
                              </div>
                            </>
                          ) : <div className="ri-writing-chart-empty">No bullet lines detected in the extracted text.</div>}
                        </div>
                        <div className="ri-writing-outcomes"><span>Phrases with numbers</span><strong>{analysis.quantifiedClaims.length}</strong><p>Text pattern only. Review each claim.</p></div>
                      </div>
                    ) : <div className="ri-chart-empty"><ListChecks size={18} /><span>Add a resume to explore text patterns.</span></div>}
                    <p className="ri-dashboard-signal-note">Uses a short verb list. A line that does not match is not necessarily weak.</p>
                  </article>
                </section>

              </div>

              <aside className="ri-dashboard-side-column">
                <section className="ri-dashboard-widget ri-dashboard-role-match">
                  <div className="ri-dashboard-widget-heading"><div><h2>Compare a role</h2><p>See which listed skills appear in your text</p></div></div>
                  <TargetRoleSelect value={targetRole} onChange={setTargetRole} label="Target role" />
                  {analysis && role ? (
                    <>
                      <div className="ri-role-match-summary"><strong>{targetRoleMatch?.matches.length || 0}<span> / {role.skills.length}</span></strong><span>skills found in text</span></div>
                      <div className="ri-role-match-track" role="progressbar" aria-label={`Catalog terms detected for ${role.name}`} aria-valuemin={0} aria-valuemax={role.skills.length} aria-valuenow={targetRoleMatch?.matches.length || 0}><i style={{ width: `${((targetRoleMatch?.matches.length || 0) / role.skills.length) * 100}%` }} /></div>
                      <details className="ri-role-match-details">
                        <summary>See matched and missing terms</summary>
                        <div><strong>Detected in text</strong><p>{targetRoleMatch?.matches.length ? targetRoleMatch.matches.join(", ") : "No catalog terms detected."}</p></div>
                        <div><strong>Not detected in text</strong><p>{targetRoleMatch?.missing.join(", ") || "All role catalog terms were detected."}</p></div>
                      </details>
                      <p className="ri-role-match-note">A missing term may still describe your experience. Check your resume.</p>
                      <Link className="ri-role-match-link" to="/resume/career-analysis">Review role skills <ArrowRight size={14} /></Link>
                    </>
                  ) : <p className="ri-role-match-empty">{analysis ? "Choose a role to compare its catalog terms with your resume text. This is not a suitability score." : "Add a resume before comparing role terms. This is not a suitability score."}</p>}
                </section>

                <section className="ri-dashboard-widget ri-dashboard-private"><ShieldCheck size={16} /><p>Your resume stays in this browser. It is sent to AI only when you choose an AI action.</p></section>
              </aside>
            </section>
          )}

          {route === "analyzer" && (
            <>
              <section className="ri-analyzer-stats" aria-label="Resume text statistics">
                <div className="ri-analyzer-stats-heading"><div><span className="eyebrow">RESUME ANALYSIS</span><h2>Resume stats</h2></div><span>ATS score estimate · text-based heuristic</span></div>
                <div className="ri-analyzer-stat-grid">
                  <article><span className="ri-analyzer-stat-icon"><FileText size={18} /></span><div><small>Words extracted</small><strong>{analysis ? analysis.wordCount.toLocaleString() : "—"}</strong><span>From the uploaded resume</span></div></article>
                  <article><span className="ri-analyzer-stat-icon skills"><Target size={18} /></span><div><small>Recognized skills</small><strong>{analysis ? analysis.foundSkills.length : "—"}</strong><span>Matches in a built-in list</span></div></article>
                  <article><span className="ri-analyzer-stat-icon sections"><ListChecks size={18} /></span><div><small>Sections detected</small><strong>{analysis ? `${analysis.presentSections.length}/${sectionCount}` : "—"}</strong><span>Standard headings in text</span></div></article>
                  <article><span className="ri-analyzer-stat-icon bullets"><BarChart3 size={18} /></span><div><small>Bullet lines</small><strong>{analysis ? analysis.bullets.length : "—"}</strong><span>{analysis ? `${analysis.actionBullets.length} start with a listed action verb` : "From extracted text"}</span></div></article>
                </div>
                {analysis ? (
                  <>
                    <article className={`ri-analyzer-score-card${analysis.atsReadiness.score >= 80 ? " strong" : analysis.atsReadiness.score >= 60 ? " good" : analysis.atsReadiness.score >= 40 ? " developing" : " needs-work"}`}>
                      <div className="ri-analyzer-score-overview">
                        <div className="ri-analyzer-score-heading"><span className="eyebrow">TEXT-BASED ESTIMATE</span><h3>ATS score</h3><p>Resume structure, contact details, skills and writing patterns.</p></div>
                        <div className="ri-analyzer-score-gauge" role="img" aria-label={`Estimated ATS score ${analysis.atsReadiness.score} out of 100; ${analysis.atsReadiness.label}`}>
                          <svg viewBox="0 0 120 120" aria-hidden="true">
                            <circle cx="60" cy="60" r="47" className="ri-analyzer-score-track" />
                            <circle cx="60" cy="60" r="47" className="ri-analyzer-score-value" strokeDasharray={`${295 * analysis.atsReadiness.score / 100} ${295 * (1 - analysis.atsReadiness.score / 100)}`} transform="rotate(-90 60 60)" />
                          </svg>
                          <span><strong>{analysis.atsReadiness.score}</strong><small>/ 100</small></span>
                        </div>
                        <span className="ri-analyzer-score-label">{analysis.atsReadiness.label}</span>
                      </div>
                      <div className="ri-analyzer-score-breakdown">
                        {analysis.atsReadiness.factors.map((factor) => (
                          <div className="ri-analyzer-score-factor" key={factor.label}>
                            <div><span>{factor.label}</span><strong>{factor.score}<small> / {factor.max}</small></strong></div>
                            <div className="ri-analyzer-score-factor-track" role="progressbar" aria-label={factor.label} aria-valuemin={0} aria-valuemax={factor.max} aria-valuenow={factor.score}><i style={{ width: `${factor.score / factor.max * 100}%` }} /></div>
                            <small>{factor.detail}</small>
                          </div>
                        ))}
                      </div>
                      <p className="ri-analyzer-score-disclaimer">This is a SkillAI heuristic from extracted text, not a score from an employer’s ATS. It does not test file layout, compare a job description, or predict screening or hiring results. Check the original resume and tailor it to the specific role.</p>
                    </article>
                    <div className="ri-analyzer-chart-grid">
                    <article className="ri-analyzer-chart-card">
                      <div className="ri-analyzer-chart-heading"><div><h3>Section coverage</h3><p>Standard headings detected in extracted text</p></div><span>{analysis.presentSections.length}/{sectionCount}</span></div>
                      <div className="ri-analyzer-coverage-content">
                        <svg className="ri-analyzer-coverage-chart" viewBox="0 0 120 120" role="img" aria-label={`${analysis.presentSections.length} of ${sectionCount} standard resume headings detected`}>
                          <circle cx="60" cy="60" r="46" className="ri-analyzer-coverage-track" />
                          <circle cx="60" cy="60" r="46" className="ri-analyzer-coverage-value" strokeDasharray={`${289 * sectionCoverage} ${289 * (1 - sectionCoverage)}`} transform="rotate(-90 60 60)" />
                          <text x="60" y="57" className="ri-analyzer-coverage-number">{analysis.presentSections.length}/{sectionCount}</text>
                          <text x="60" y="75" className="ri-analyzer-coverage-label">headings</text>
                        </svg>
                        <div className="ri-analyzer-section-list">
                          {Object.keys(SECTION_HEADINGS).map((section) => {
                            const detected = analysis.presentSections.includes(section);
                            const label = section.charAt(0).toUpperCase() + section.slice(1);
                            return <span className={detected ? "detected" : ""} key={section}><i />{label}</span>;
                          })}
                        </div>
                      </div>
                      <p className="ri-analyzer-chart-note">A heading not detected here may still exist in a format the text extractor could not read.</p>
                    </article>
                    <article className="ri-analyzer-chart-card">
                      <div className="ri-analyzer-chart-heading"><div><h3>Skills by field</h3><p>Recognized catalog terms grouped by sector</p></div><span>{analysis.foundSkills.length} found</span></div>
                      {skillSectors.length ? (
                        <div className="ri-analyzer-sector-chart" role="img" aria-label={`Recognized terms by field: ${skillSectors.map(({ name, count }) => `${name}, ${count}`).join("; ")}`}>
                          {skillSectors.slice(0, 5).map(({ name, count }) => (
                            <div className="ri-analyzer-sector-row" key={name}>
                              <span title={name}>{name}</span><span className="ri-analyzer-sector-track"><i style={{ width: `${Math.max(8, count / Math.max(...skillSectors.map((item) => item.count)) * 100)}%` }} /></span><strong>{count}</strong>
                            </div>
                          ))}
                        </div>
                      ) : <div className="ri-analyzer-chart-empty"><Target size={19} /><span>No built-in catalog terms detected in the text.</span></div>}
                      <div className="ri-analyzer-skill-tags" aria-label="Recognized skills">{analysis.foundSkills.slice(0, 10).map((skill) => <span key={skill}>{skill}</span>)}{analysis.foundSkills.length > 10 && <span>+{analysis.foundSkills.length - 10} more</span>}</div>
                    </article>
                    <article className="ri-analyzer-chart-card ri-analyzer-writing-card">
                      <div className="ri-analyzer-chart-heading"><div><h3>Writing patterns</h3><p>Bullet starts and number patterns in your text</p></div><span>Text check only</span></div>
                      <div className="ri-analyzer-writing-layout">
                        <div className="ri-analyzer-writing-main">
                          <div className="ri-analyzer-writing-label"><strong>{analysis.actionBullets.length}<span> / {analysis.bullets.length}</span></strong><span>bullet lines start with a verb from a limited list</span></div>
                          <div className="ri-analyzer-writing-track" role="img" aria-label={`${analysis.actionBullets.length} of ${analysis.bullets.length} bullet lines start with a listed action verb`}>
                            <i style={{ width: `${analysis.bullets.length ? (analysis.actionBullets.length / analysis.bullets.length) * 100 : 0}%` }} />
                          </div>
                          <div className="ri-analyzer-writing-legend"><span><i className="action" />Listed action-verb starts</span><span><i />Other bullet starts</span></div>
                        </div>
                        <div className="ri-analyzer-quantified"><small>Number-pattern phrases</small><strong>{analysis.quantifiedClaims.length}</strong><span>Review each claim against your source.</span></div>
                      </div>
                      <p className="ri-analyzer-chart-note">A bullet outside the limited verb list is not necessarily weak. No claims are independently verified.</p>
                    </article>
                    </div>
                  </>
                ) : (
                  <div className="ri-analyzer-stats-empty"><FileText size={20} /><strong>Your stats will appear here</strong><span>Upload a resume above to see section, skill and writing-pattern charts.</span></div>
                )}
              </section>
              <article className="ri-card ri-analyzer-source"><h2>Review the source, not just the parser</h2><p>Check extracted text against the original resume. If a heading or line is missing here, verify the source PDF before changing your resume.</p>{analysis && <details className="ri-extracted-text"><summary>Review extracted resume text</summary><pre>{resumeText}</pre></details>}</article>
              {analysis?.quantifiedClaims.length > 0 && <article className="ri-card"><h2>Evidence review</h2><p>Check the source for every measurable claim. SkillAI has not independently verified these statements.</p>{analysis.quantifiedClaims.map((claim) => <div className="ri-evidence-row" key={claim}><span className="ri-priority medium">User-provided</span><span>{claim}</span><strong>Needs evidence</strong></div>)}</article>}
              <section className="ri-card ri-ai-resume-card">
                <div className="ri-section-heading"><div><span className="eyebrow">AI WRITING COACH</span><h2>Get an evidence-based resume review</h2><p>AI reviews clarity and relevance using only the text you provide. It cannot verify claims or predict hiring results.</p></div><button type="button" className="primary-button" onClick={() => void runAI("analyze")} disabled={Boolean(aiLoading) || resumeText.trim().length < 80}>{aiLoading === "analyze" ? "Reviewing…" : "Review with AI"} <Sparkles size={16} /></button></div>
                <p className="ri-ai-privacy-note"><ShieldCheck size={14} /> Your resume text is sent to the AI provider only after you select “Review with AI”.</p>
                {aiResults.analyze && <div className="ri-ai-review-result">
                  <p className="ri-ai-summary">{aiResults.analyze.summary}</p>
                  <div className="ri-columns">
                    <article><h3>Strengths in your text</h3>{aiResults.analyze.strengths.map((item, index) => <div className="ri-ai-feedback-item" key={`strength-${index}`}><strong>{item.point}</strong><p>Evidence: “{item.evidence}”</p></div>)}</article>
                    <article><h3>Ways to improve</h3>{aiResults.analyze.improvements.map((item, index) => <div className="ri-ai-feedback-item" key={`improvement-${index}`}><strong>{item.point}</strong><p>{item.suggestion}</p><small>Based on: “{item.evidence}”</small></div>)}</article>
                  </div>
                  <p className="ri-disclaimer">AI suggestions can be wrong. Verify every quotation and recommendation against your original resume before using it.</p>
                </div>}
              </section>
            </>
          )}

          {route === "builder" && <ResumeBuilder profile={profile} onUpdate={updateProfile} onExport={exportResume} onBuilt={(text) => handleResumeRead(text, "Builder draft saved locally.", false, "")} />}

          {isMatchTailorRoute && (
            <section className="ri-card ri-match-tailor-workspace">
              <div className="ri-match-tailor-inputs">
                <div><h2>Use one job description for both tools</h2><p>Compare exact resume terms first, then switch to tailoring without pasting the job again.</p></div>
                <TargetRoleSelect value={targetRole} onChange={(value) => { setTargetRole(value); setAiResults((current) => ({ ...current, tailor: null })); }} />
                <label className="ri-job-description-field">
                  Job description
                  <textarea className="ri-textarea" rows={7} maxLength={12000} value={jobDescription} onChange={(event) => { setJobDescription(event.target.value); setAiResults((current) => ({ ...current, tailor: null })); }} placeholder="Paste the complete job description, including responsibilities and requirements…" />
                  <span>{jobDescription.length.toLocaleString()} / 12,000 characters · Keep the original wording for a more useful comparison.</span>
                </label>
              </div>

              <div className="ri-match-tailor-tabs" role="tablist" aria-label="Job description tools">
                <button id="resume-match-tab" type="button" role="tab" aria-selected={matchTailorTab === "match"} className={matchTailorTab === "match" ? "active" : ""} onClick={() => setMatchTailorTab("match")}><Target size={16} /> Match resume</button>
                <button id="resume-tailor-tab" type="button" role="tab" aria-selected={matchTailorTab === "tailor"} className={matchTailorTab === "tailor" ? "active" : ""} onClick={() => setMatchTailorTab("tailor")}><Sparkles size={16} /> Tailor resume</button>
              </div>

              {matchTailorTab === "match" ? (
                <div className="ri-match-tailor-panel" role="tabpanel" aria-labelledby="resume-match-tab">
                  <h2>Job description match</h2>
                  <p>Review skills found in your resume text and terms not detected. This comparison does not assess your suitability.</p>
                  <JobMatchReport
                    report={jobMatchReport}
                    hasResume={resumeText.trim().length >= 80}
                    hasRole={Boolean(role)}
                    hasJobDescription={jobDescription.trim().length >= 40}
                    roleName={role?.name || ""}
                  />
                  {jobMatchReport && <button type="button" className="primary-button" onClick={() => setMatchTailorTab("tailor")}>Continue to Resume Tailor <ArrowRight size={16} /></button>}
                </div>
              ) : (
                <div className="ri-match-tailor-panel" role="tabpanel" aria-labelledby="resume-tailor-tab">
                  <h2>Create a professional resume for this job</h2>
                  <p>Detected skills missing from your resume can be placed under Skills. Verify every suggestion against your real experience.</p>
                  <label className="ri-tailor-heading-color">
                    <span><strong>Resume heading color</strong><small>Used in Word and PDF downloads.</small></span>
                    <input
                      type="color"
                      aria-label="Resume heading color"
                      value={normalizeHexColor(tailorHeadingColor)}
                      onChange={(event) => {
                        const color = normalizeHexColor(event.target.value);
                        setTailorHeadingColor(color);
                        writeStored(tailorHeadingColorStorageKey, color);
                      }}
                    />
                  </label>
                  <div className="ri-ai-action-row"><button type="button" className="primary-button" onClick={() => void runAI("tailor", { targetRole, jobDescription })} disabled={Boolean(aiLoading) || resumeText.trim().length < 80 || jobDescription.trim().length < 40}>{aiLoading === "tailor" ? "Tailoring your resume…" : "Tailor my resume for this job"} <Sparkles size={16} /></button><span className="ri-ai-privacy-note"><ShieldCheck size={14} /> Resume and job description are sent to AI only when you choose this action.</span></div>
                  {aiResults.tailor && <div className="ri-ai-tailor-result">
                    <div className="ri-section-heading"><div><span className="eyebrow">YOUR JOB-TAILORED RESUME</span><h3>Review your professional draft</h3><p>Check every detail against your original before downloading or applying.</p></div><div className="ri-tailor-result-actions"><button type="button" className="primary-button" onClick={() => void downloadTailoredDraft()} disabled={Boolean(aiLoading)}><Download size={16} />{aiLoading === "tailor-download" ? "Preparing Word file…" : "Download Word resume"}</button><button type="button" className="secondary-button" onClick={downloadTailoredPdf}><Download size={16} /> Download PDF</button><button type="button" className="secondary-button" onClick={applyTailoredDraft}>Save as my current resume</button></div></div>
                    {aiResults.tailor.addedSkills.length > 0 && <p className="ri-ai-summary">{aiResults.tailor.addedSkills.length} JD skill{aiResults.tailor.addedSkills.length === 1 ? "" : "s"} missing from the source resume {aiResults.tailor.addedSkills.length === 1 ? "was" : "were"} placed in the resume’s Skills section. Please verify them before applying.</p>}
                    <pre aria-label="Job-tailored resume preview">{aiResults.tailor.draft}</pre>
                    <div className="ri-columns"><article><h3>Changes made</h3><ul>{aiResults.tailor.changes.map((item, index) => <li key={`change-${index}`}>{item}</li>)}</ul></article><article><h3>Evidence to review</h3>{aiResults.tailor.reviewNotes.length ? <ul>{aiResults.tailor.reviewNotes.map((item, index) => <li key={`review-${index}`}>{item}</li>)}</ul> : <p>No specific missing-evidence notes returned. Still verify every detail against your original.</p>}</article></div>
                    <p className="ri-disclaimer">AI can still introduce errors. Replacing the current resume overwrites its text on this device; verify all claims before downloading or applying.</p>
                  </div>}
                  <p className="ri-disclaimer">AI may miss or misinterpret information. No experience, skills, metrics, or project results should be used unless you can verify them.</p>
                </div>
              )}
            </section>
          )}

          {route === "job-match" && (
            <JobSearch analysis={analysis} resumeText={resumeText} />
          )}

          {isCareerAnalysisRoute && <div className="ri-career-analysis-tabs" role="tablist" aria-label="Career analysis tools">
            <button id="career-skills-tab" type="button" role="tab" aria-selected={careerAnalysisTab === "skills"} className={careerAnalysisTab === "skills" ? "active" : ""} onClick={() => setCareerAnalysisTab("skills")}><GraduationCap size={16} /> Skill gaps</button>
            <button id="career-project-tab" type="button" role="tab" aria-selected={careerAnalysisTab === "project"} className={careerAnalysisTab === "project" ? "active" : ""} onClick={() => setCareerAnalysisTab("project")}><FolderKanban size={16} /> Project analyzer</button>
          </div>}

          {isCareerAnalysisRoute && careerAnalysisTab === "skills" && (
            <section className="ri-card">
              <TargetRoleSelect
                value={targetRole}
                onChange={(value) => {
                  setTargetRole(value);
                  setAiResults((current) => ({ ...current, "skill-gaps": null }));
                }}
              />
              {role ? (
                <>
                  <h2>{role.name}: catalog term check</h2>
                  <span className="eyebrow">{role.sector}</span>
                  <div className="ri-skill-list">
                    {role.skills.map((skill) => {
                      const found = includesTerm(resumeText, skill);
                      return (
                        <div className="ri-skill-row" key={skill}>
                          <span>{skill}</span>
                          <span className={found ? "ri-skill-found" : "ri-skill-gap"}>
                            {found ? "Term found in resume text" : "Term not found in resume text"}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                  <button
                    type="button"
                    className="primary-button ri-ai-skill-button"
                    onClick={() => void runAI("skill-gaps", { targetRole: role.name, requiredSkills: role.skills })}
                    disabled={Boolean(aiLoading) || resumeText.trim().length < 80}
                  >
                    {aiLoading === "skill-gaps" ? "Reviewing evidence…" : "Review skills with AI"} <Sparkles size={16} />
                  </button>
                  <p className="ri-ai-privacy-note"><ShieldCheck size={14} /> Your resume text is sent to the AI provider only when you request this review.</p>
                </>
              ) : <p>Choose a sector and target role to see exact term matches.</p>}
              {aiResults["skill-gaps"] && (
                <div className="ri-ai-skill-result">
                  <h3>AI evidence review</h3>
                  <p>{aiResults["skill-gaps"].summary}</p>
                  <div className="ri-columns">
                    <article>
                      <h3>Skills with evidence</h3>
                      {aiResults["skill-gaps"].evidenced.length
                        ? aiResults["skill-gaps"].evidenced.map((item) => (
                          <div className="ri-ai-feedback-item" key={`evidence-${item.skill}`}>
                            <strong>{item.skill}</strong><p>“{item.evidence}”</p>
                          </div>
                        ))
                        : <p>No clear evidence found in the text for the listed skills.</p>}
                    </article>
                    <article>
                      <h3>Not evidenced in this text</h3>
                      {aiResults["skill-gaps"].gaps.length
                        ? aiResults["skill-gaps"].gaps.map((item) => (
                          <div className="ri-ai-feedback-item" key={`gap-${item.skill}`}>
                            <strong>{item.skill}</strong><p>{item.nextStep}</p>
                          </div>
                        ))
                        : <p>The AI did not identify any additional text gaps in the supplied role catalog.</p>}
                    </article>
                  </div>
                  <h3>Questions to check transferable experience</h3>
                  <ul>{aiResults["skill-gaps"].questions.map((item, index) => <li key={`question-${index}`}>{item}</li>)}</ul>
                  <p className="ri-disclaimer">A gap means the resume text didn't clearly evidence a skill; it doesn't mean you lack that skill. Verify the quotations and suggestions.</p>
                </div>
              )}
              <p className="ri-disclaimer">Exact term matches and AI feedback are coaching aids, not hiring predictions. Verify against your resume and experience.</p>
              <Link to="/roadmap" className="primary-button">Explore my career roadmap <ArrowRight size={16} /></Link>
            </section>
          )}

          {isCareerAnalysisRoute && careerAnalysisTab === "project" && (
            <section className="ri-card"><h2>Describe a real project</h2><div className="ri-form-grid">{[
              ["name", "Project name", "text"], ["github", "GitHub URL", "url"], ["liveUrl", "Live project URL", "url"], ["documentation", "Documentation URL", "url"], ["technologies", "Technologies you used", "text"],
            ].map(([key, label, type]) => <label key={key}>{label}<input type={type} value={project[key]} onChange={(event) => setProject((current) => ({ ...current, [key]: event.target.value }))} /></label>)}</div><label className="ri-field-block">What did you build? Include only verifiable details.<textarea className="ri-textarea" rows={5} value={project.description} onChange={(event) => setProject((current) => ({ ...current, description: event.target.value }))} /></label>
              {project.description && <div className="ri-columns"><MetricCard label="Project details provided" value={`${Object.values(project).filter((value) => value.trim()).length} of ${Object.keys(project).length}`} note="Count of non-empty form fields; repository and code are not inspected" /><article className="ri-card"><h2>Draft using your wording</h2><p>{`${project.name || "Project"}: ${project.description.trim()}${project.technologies ? ` Technologies: ${project.technologies}.` : ""}`}</p><small>This draft only combines text you entered. It does not verify links, technologies, or outcomes.</small></article></div>}
            </section>
          )}

          {route === "profile" && (
            <CareerProfile text={resumeText} profile={profile} onUpdate={updateProfile} />
          )}

        </section>
      </div>
    </main>
  );
}

function TargetRoleSelect({ value, onChange, label = "Sector and target role" }) {
  return <label className="ri-role-select">{label}<select value={value} onChange={(event) => onChange(event.target.value)}><option value="">Choose a role</option>{SECTORS.map((sector) => <optgroup label={sector} key={sector}>{ROLES.filter((role) => role.sector === sector).map((role) => <option key={role.name} value={role.name}>{role.name}</option>)}</optgroup>)}</select></label>;
}

function InfoRows({ label, values, empty }) {
  return <div className="ri-info-row"><strong>{label}</strong>{values.length ? <div>{values.map((value) => <span key={value}>{value}</span>)}</div> : <small>{empty}</small>}</div>;
}

function JobMatchReport({ report, hasResume, hasRole, hasJobDescription, roleName }) {
  if (!report) {
    const missingInputs = [
      !hasResume && "Upload or add at least 80 characters of resume text",
      !hasRole && "Choose the target role",
      !hasJobDescription && "Paste at least 40 characters of the job description",
    ].filter(Boolean);

    return (
      <div className="ri-job-match-empty" role="status">
        <h3>Complete these inputs to see your comparison</h3>
        <ul>{missingInputs.map((item) => <li key={item}>{item}</li>)}</ul>
        <p>The analysis runs locally in your browser and updates as you edit.</p>
      </div>
    );
  }

  const factorsId = "job-match-score-factors";
  return (
    <div className="ri-job-match-report" aria-labelledby="job-match-report-title">
      <section className="ri-job-match-score">
        <div className="ri-job-match-score-number" aria-label={`Text alignment score ${report.score.toFixed(1)} out of 10`}>
          <strong>{report.score.toFixed(1)}</strong><span>/ 10</span>
        </div>
        <div className="ri-job-match-score-summary">
          <span className="eyebrow">TEXT ALIGNMENT</span>
          <h3 id="job-match-report-title">{report.scoreLabel}</h3>
          <p>For <strong>{roleName}</strong>. This is a resume-to-description text comparison, not a measure of your ability or likelihood of being hired.</p>
          <div
            className="ri-job-match-score-track"
            role="progressbar"
            aria-label="Resume text alignment"
            aria-valuemin={0}
            aria-valuemax={10}
            aria-valuenow={report.score}
            aria-describedby={factorsId}
          ><span style={{ width: `${report.score * 10}%` }} /></div>
        </div>
      </section>

      <section className="ri-job-match-factors" id={factorsId} aria-label="How the score is calculated">
        <div className="ri-job-match-section-heading">
          <div><h3>How this score is calculated</h3><p>Each factor is scored from 0 to 10, then weighted as shown.</p></div>
          <span>Heuristic, not an employer ATS score</span>
        </div>
        {report.factors.map((factor) => (
          <div className="ri-job-match-factor" key={factor.label}>
            <div className="ri-job-match-factor-title">
              <strong>{factor.label}</strong>
              <span>{factor.score.toFixed(1)} / 10 · {factor.weight}% weight · {factor.weightedPoints.toFixed(1)} points</span>
            </div>
            <div className="ri-job-match-factor-track" role="progressbar" aria-label={`${factor.label} score`} aria-valuemin={0} aria-valuemax={10} aria-valuenow={factor.score}>
              <span style={{ width: `${factor.score * 10}%` }} />
            </div>
            <p>{factor.detail}</p>
          </div>
        ))}
        <p className="ri-job-match-method-note">{report.requirementsSource}. Skill and keyword matches use normalized text terms; section checks use headings. Related wording or equivalent experience may not be detected.</p>
      </section>

      <section className="ri-job-match-section">
        <div className="ri-job-match-section-heading"><div><h3>Job requirements</h3><p>{report.requirements.length} catalog skill terms used in this comparison</p></div></div>
        <InfoRows label={`Selected-role skills mentioned in the job description · ${report.roleSkillsInJd.length}`} values={report.roleSkillsInJd} empty="No selected-role catalog terms were detected in the job description." />
        <div className="ri-job-match-lists">
          <InfoRows label={`Found in resume · ${report.matchedRequirements.length}`} values={report.matchedRequirements} empty="No selected requirement terms were detected in the resume text." />
          <InfoRows label={`Not found in resume · ${report.missingRequirements.length}`} values={report.missingRequirements} empty="All selected requirement terms were detected. Check that each has a truthful example." />
        </div>
      </section>

      <section className="ri-job-match-section">
        <div className="ri-job-match-section-heading"><div><h3>{roleName} role skills</h3><p>{report.matchedRoleSkills.length} of {report.matchedRoleSkills.length + report.missingRoleSkills.length} catalog terms found in your resume</p></div></div>
        <div className="ri-job-match-lists">
          <InfoRows label={`Found in resume · ${report.matchedRoleSkills.length}`} values={report.matchedRoleSkills} empty="No target-role catalog terms were detected." />
          <InfoRows label={`Not found in resume · ${report.missingRoleSkills.length}`} values={report.missingRoleSkills} empty="All target-role catalog terms were detected." />
        </div>
      </section>

      <section className="ri-job-match-section">
        <div className="ri-job-match-section-heading"><div><h3>Frequent job-description terms</h3><p>{report.matchedKeywords.length} of {report.jdKeywordCount} selected terms also occur in your resume</p></div></div>
        <div className="ri-job-match-lists">
          <InfoRows label={`Also in resume · ${report.matchedKeywords.length}`} values={report.matchedKeywords} empty="No frequent non-skill terms overlapped." />
          <InfoRows label={`Not found in resume · ${report.missingKeywords.length}`} values={report.missingKeywords} empty="No additional frequent terms to review." />
        </div>
      </section>

      <section className="ri-job-match-section">
        <div className="ri-job-match-section-heading"><div><h3>Recommended next steps</h3><p>Use only suggestions supported by your real experience.</p></div></div>
        <div className="ri-job-match-recommendations">
          {report.recommendations.map((recommendation, index) => (
            <article key={recommendation.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div><div><strong>{recommendation.title}</strong><small>{recommendation.priority}</small></div><p>{recommendation.detail}</p></div>
            </article>
          ))}
        </div>
      </section>

      <p className="ri-job-match-disclaimer"><ShieldCheck size={16} /> This local heuristic checks catalog skills, frequent terms, and section headings. It does not understand context reliably, verify claims, or predict ATS decisions, interview chances, or hiring outcomes. Review the original job description and every suggestion yourself.</p>
    </div>
  );
}

const RESUME_TEMPLATES = [
  { id: "classic", name: "Professional", description: "The clean single-column style from your CV.", headshot: false, graphics: "None", columns: 1 },
  { id: "modern", name: "Modern", description: "Contemporary spacing with accent section titles.", headshot: true, graphics: "Simple", columns: 1 },
  { id: "compact", name: "Compact", description: "Tighter layout to fit more content on each page.", headshot: false, graphics: "None", columns: 1 },
  { id: "executive", name: "Executive", description: "A centered, confident header for leadership roles.", headshot: true, graphics: "Simple", columns: 1 },
  { id: "sidebar", name: "Sidebar", description: "A strong left rail with neatly grouped sections.", headshot: true, graphics: "Decorative", columns: 2 },
  { id: "minimal", name: "Minimal", description: "Simple typography with plenty of breathing room.", headshot: false, graphics: "None", columns: 1 },
  { id: "bold", name: "Bold", description: "High-contrast headings and a prominent name.", headshot: false, graphics: "Decorative", columns: 1 },
  { id: "elegant", name: "Elegant", description: "A refined, centered layout with classic typography.", headshot: false, graphics: "Simple", columns: 1 },
  { id: "technical", name: "Technical", description: "Precise typography for engineering and technology.", headshot: false, graphics: "Simple", columns: 1 },
  { id: "clean", name: "Clean", description: "Quiet section markers and a crisp page structure.", headshot: false, graphics: "None", columns: 1 },
  { id: "split", name: "Split Columns", description: "A strong side column for skills and education.", headshot: true, graphics: "Decorative", columns: 2 },
  { id: "timeline", name: "Timeline", description: "A vertical accent line connects your career sections.", headshot: false, graphics: "Simple", columns: 1 },
  { id: "banner", name: "Color Banner", description: "A bold full-width name banner anchors the page.", headshot: true, graphics: "Decorative", columns: 1 },
  { id: "editorial", name: "Editorial", description: "Serif typography and spacious editorial hierarchy.", headshot: false, graphics: "Simple", columns: 1 },
  { id: "infographic", name: "Skill Focus", description: "Skills-first hierarchy for technical profiles.", headshot: false, graphics: "Decorative", columns: 1 },
  { id: "monochrome", name: "Monochrome", description: "High-contrast grayscale with a compact header.", headshot: false, graphics: "None", columns: 1 },
  { id: "framed", name: "Framed", description: "A fine accent frame surrounds a classic page.", headshot: false, graphics: "Simple", columns: 1 },
  { id: "topline", name: "Topline", description: "A crisp top rule and structured section dividers.", headshot: false, graphics: "Simple", columns: 1 },
  { id: "portfolio", name: "Portfolio", description: "A project-oriented two-column professional layout.", headshot: true, graphics: "Decorative", columns: 2 },
  { id: "stacked", name: "Stacked Header", description: "A centered nameplate with orderly content below.", headshot: false, graphics: "None", columns: 1 },
];

const TEMPLATE_COLORS = [
  { name: "Rust", hex: "#A8401A" },
  { name: "Charcoal", hex: "#323940" },
  { name: "Taupe", hex: "#AD9E98" },
  { name: "Navy", hex: "#164A8A" },
  { name: "Blue", hex: "#4385DC" },
  { name: "Teal", hex: "#00A4B8" },
  { name: "Green", hex: "#25816E" },
  { name: "Orange", hex: "#F28C13" },
  { name: "Red", hex: "#CA3D4B" },
];

function TemplatePaper({ template, color, hasHeadshot, photoDataUrl }) {
  return (
    <span className={`ri-template-paper ri-template-paper-${template}`} style={{ "--template-accent": color }} aria-hidden="true">
      <span className="ri-template-paper-header">
        {hasHeadshot && <span className="ri-template-avatar">{photoDataUrl ? <img src={photoDataUrl} alt="" /> : "Photo"}</span>}
        <span className="ri-template-paper-name">DIYA AGARWAL</span>
        <span className="ri-template-paper-contact">+91 98765 43210 · diya@example.com · linkedin.com/in/diyaagarwal · github.com/diyaagarwal</span>
      </span>
      <span className="ri-template-paper-body">
        {["sidebar", "split", "portfolio"].includes(template) && <span className="ri-template-paper-rail"><b>{template === "portfolio" ? "PORTFOLIO" : "SKILLS"}</b><i>Communication</i><i>Data analysis</i><i>Project planning</i><b>{template === "portfolio" ? "TOOLS" : "EDUCATION"}</b><i>Bachelor's degree</i></span>}
        <span className="ri-template-paper-main">
          <span className="ri-template-paper-section">
            <b>PROFESSIONAL SUMMARY</b>
            <i>Customer-focused operations professional with 4+ years of experience coordinating daily business activities, supporting cross-functional teams and improving service delivery. Recognized for clear communication, accurate reporting and a practical approach to solving customer and process challenges.</i>
          </span>
          {!["sidebar", "split", "portfolio"].includes(template) && <span className="ri-template-paper-section">
            <b>CORE SKILLS</b>
            <i>Operations coordination · Customer service · Process improvement · Data reporting · Microsoft Excel · Project support · Documentation · Team collaboration · Scheduling · Problem solving</i>
          </span>}
          <span className="ri-template-paper-section">
            <b>PROFESSIONAL EXPERIENCE</b>
            <strong>Operations Associate · Northstar Services <small>2023 – Present</small></strong>
            <i>• Coordinate daily service requests and track work across a team of 12 associates.</i>
            <i>• Prepare weekly Excel reports, verify records and share progress with team leads.</i>
            <i>• Updated the handover checklist to make shift transitions more consistent.</i>
            <strong>Customer Support Coordinator · Cedar & Co. <small>2021 – 2023</small></strong>
            <i>• Responded to customer enquiries and documented requests through resolution.</i>
            <i>• Worked with billing and fulfilment teams to resolve order issues on time.</i>
          </span>
          <span className="ri-template-paper-section">
            <b>SELECTED PROJECTS</b>
            <strong>Service Insights Dashboard</strong>
            <i>Built an Excel dashboard to track request volume, response time and monthly trends.</i>
            <strong>Team Handover Toolkit</strong>
            <i>Created shared checklists and reference notes for recurring support workflows.</i>
          </span>
          <span className="ri-template-paper-section">
            <b>EDUCATION</b>
            <strong>Bachelor of Business Administration</strong>
            <i>University of Delhi · 2021</i>
            <strong>Higher Secondary Certificate</strong>
            <i>Central Public School · 2018</i>
          </span>
          {!["sidebar", "split", "portfolio"].includes(template) && <span className="ri-template-paper-section">
            <b>CERTIFICATIONS & LANGUAGES</b>
            <i>Excel for Business · Customer Experience Foundations</i>
            <i>English (Professional) · Hindi (Native)</i>
          </span>}
        </span>
      </span>
    </span>
  );
}

function ExperienceEntryEditor({ entries, onChange }) {
  const addEntry = () => onChange([
    ...entries,
    { id: `experience-${globalThis.crypto?.randomUUID?.() || `${Date.now()}-${entries.length}`}`, role: "", company: "", startDate: "", endDate: "", description: "" },
  ]);
  const updateEntry = (id, field, value) => onChange(entries.map((entry) => entry.id === id ? { ...entry, [field]: value } : entry));
  const removeEntry = (id) => onChange(entries.filter((entry) => entry.id !== id));

  return (
    <div className="ri-experience-editor">
      <div className="ri-experience-editor-heading">
        <div><strong>Work experience entries</strong><small>Enter your dates here. They will align to the right beside each role in the resume.</small></div>
        <button type="button" className="secondary-button ri-add-experience" onClick={addEntry}><Plus size={17} aria-hidden="true" /> Add experience</button>
      </div>
      {entries.map((entry, index) => (
        <fieldset className="ri-experience-entry" key={entry.id}>
          <legend>Experience {String(index + 1).padStart(2, "0")}</legend>
          <button type="button" className="ri-remove-experience" onClick={() => removeEntry(entry.id)} aria-label={`Remove experience ${index + 1}`} title="Remove this experience"><Trash2 size={16} aria-hidden="true" /></button>
          <div className="ri-experience-entry-grid">
            <label>Job title<input value={entry.role || ""} onChange={(event) => updateEntry(entry.id, "role", event.target.value)} placeholder="e.g. Software Engineer" /></label>
            <label>Company<input value={entry.company || ""} onChange={(event) => updateEntry(entry.id, "company", event.target.value)} placeholder="Company name" /></label>
            <label>Start year<input inputMode="numeric" value={entry.startDate || ""} onChange={(event) => updateEntry(entry.id, "startDate", event.target.value)} placeholder="e.g. 2022" /></label>
            <label>End year<input value={entry.endDate || ""} onChange={(event) => updateEntry(entry.id, "endDate", event.target.value)} placeholder="e.g. 2025 or Present" /></label>
            <label className="ri-grid-full">Responsibilities and outcomes<textarea rows={4} value={entry.description || ""} onChange={(event) => updateEntry(entry.id, "description", event.target.value)} placeholder="Add verified responsibilities or achievements; use one line per item." /></label>
          </div>
        </fieldset>
      ))}
      {!entries.length && <p className="ri-experience-empty">No structured work history added. Keep using the details field below or add a role.</p>}
    </div>
  );
}

function ResumeBuilder({ profile, onUpdate, onExport, onBuilt }) {
  const [customSection, setCustomSection] = useState("");
  const [sections, setSections] = useState(SECTIONS);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [showAssist, setShowAssist] = useState(false);
  const [bullet, setBullet] = useState("");
  const [templateChosen, setTemplateChosen] = useState(false);
  const template = RESUME_TEMPLATES.some((item) => item.id === profile.template) ? profile.template : "classic";
  const templateColor = TEMPLATE_COLORS.some((item) => item.hex === profile.templateColor) ? profile.templateColor : TEMPLATE_COLORS[0].hex;
  const [headshotFilter, setHeadshotFilter] = useState("all");
  const [graphicsFilter, setGraphicsFilter] = useState("all");
  const [columnsFilter, setColumnsFilter] = useState("all");
  const [photoError, setPhotoError] = useState("");
  const [photoBusy, setPhotoBusy] = useState(false);
  const selectedTemplate = RESUME_TEMPLATES.find((item) => item.id === template) || RESUME_TEMPLATES[0];
  const visibleTemplates = RESUME_TEMPLATES.filter((item) =>
    (headshotFilter === "all" || item.headshot === (headshotFilter === "yes"))
    && (graphicsFilter === "all" || item.graphics === graphicsFilter)
    && (columnsFilter === "all" || item.columns === Number(columnsFilter)));
  const sectionKey = (section) => section.startsWith("custom:") ? section : section.toLowerCase();
  const sectionLabel = (section) => section.startsWith("custom:") ? section.slice(7) : section;
  const secondarySectionNames = new Set(["skills", "education", "certifications", "languages", "training"]);
  const experienceEntries = Array.isArray(profile.experienceEntries) ? profile.experienceEntries : [];
  const experienceText = experienceEntries
    .filter((entry) => [entry.role, entry.company, entry.startDate, entry.endDate, entry.description].some(Boolean))
    .map((entry) => {
      const heading = [entry.role, entry.company].filter(Boolean).join(" | ");
      const dates = [entry.startDate, entry.endDate].filter(Boolean).join(" – ");
      return `${heading}${dates ? `\t${dates}` : ""}${entry.description ? `\n${entry.description}` : ""}`;
    }).join("\n\n");
  const sectionContent = (section) => {
    const key = sectionKey(section);
    return key === "experience" ? [profile.experience, experienceText].filter(Boolean).join("\n\n") : profile[key];
  };
  const populatedSections = sections
    .filter((section) => sectionContent(section))
    .map((section) => ({ id: section, label: sectionLabel(section), content: sectionContent(section) }));
  const initials = (profile.name || "Your Name").split(/\s+/).filter(Boolean).slice(0, 2).map((part) => part[0]).join("").toUpperCase();
  const handlePhotoChange = async (event) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    setPhotoBusy(true);
    setPhotoError("");
    try {
      onUpdate("photoDataUrl", await resizeResumePhoto(file));
    } catch (error) {
      setPhotoError(error.message || "This photo could not be saved.");
    } finally {
      setPhotoBusy(false);
    }
  };
  const contactItems = [
    { key: "phone", label: "Phone", value: profile.phone, Icon: Phone },
    { key: "email", label: "Email", value: profile.email, Icon: Mail },
    { key: "linkedin", label: "LinkedIn", value: profile.linkedin, Icon: Linkedin },
    { key: "github", label: "GitHub", value: profile.github, Icon: Github },
  ].filter((item) => item.value);
  const renderResumeSections = (items) => items.map((section) => {
    const isExperience = section.id.toLowerCase() === "experience";
    return (
      <section key={section.id}>
        <h3>{section.label}</h3>
        {isExperience && experienceEntries.filter((entry) => [entry.role, entry.company, entry.startDate, entry.endDate, entry.description].some(Boolean)).map((entry) => (
          <div className="ri-resume-experience-entry" key={entry.id}>
            <div className="ri-resume-experience-heading">
              <strong>{[entry.role, entry.company].filter(Boolean).join(" | ")}</strong>
              {(entry.startDate || entry.endDate) && <span>{[entry.startDate, entry.endDate].filter(Boolean).join(" – ")}</span>}
            </div>
            {entry.description && <p>{entry.description}</p>}
          </div>
        ))}
        {isExperience ? profile.experience && <p>{profile.experience}</p> : <p>{section.content}</p>}
      </section>
    );
  });
  const fullText = [
    profile.name || "Your Name",
    contactItems.map(({ label, value }) => `${label}: ${value}`).join("  |  "),
    profile.headline || "",
    ...sections.filter((section) => sectionContent(section)).map((section) => `${sectionLabel(section)}\n${sectionContent(section)}`),
  ].filter(Boolean).join("\n\n");
  const moveSection = (index, direction) => {
    const next = [...sections];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
  };
  const removeSection = (index) => {
    setSections((current) => current.filter((_, currentIndex) => currentIndex !== index));
    setDraggedIndex(null);
  };
  const addCustom = () => {
    const label = customSection.trim();
    if (label && !sections.some((section) => sectionLabel(section).toLowerCase() === label.toLowerCase())) setSections((current) => [...current, `custom:${label}`]);
    setCustomSection("");
  };
  const rewriteBullet = () => {
    const sentence = bullet.trim().replace(/[.!?]*$/, "");
    return sentence ? `${sentence}${/[.!?]$/.test(bullet.trim()) ? "" : "."}` : "";
  };
  return (
    <div className={`ri-builder-layout${templateChosen ? " ri-builder-editing" : " ri-builder-template-select"}`}>
      {!templateChosen && <fieldset className="ri-template-picker">
        <legend>Choose a resume template</legend>
        <h2>Templates we recommend for you</h2>
        <p className="ri-template-picker-hint">You can always change your template later.</p>
        <div className="ri-template-filters" aria-label="Filter resume templates">
          <strong>Filter by</strong>
          <label><span>Headshot</span><select aria-label="Filter by headshot" value={headshotFilter} onChange={(event) => setHeadshotFilter(event.target.value)}><option value="all">Any headshot</option><option value="yes">With headshot</option><option value="no">Without headshot</option></select></label>
          <label><span>Graphics</span><select aria-label="Filter by graphics" value={graphicsFilter} onChange={(event) => setGraphicsFilter(event.target.value)}><option value="all">Any graphics</option><option value="None">No graphics</option><option value="Simple">Simple graphics</option><option value="Decorative">Decorative graphics</option></select></label>
          <label><span>Columns</span><select aria-label="Filter by columns" value={columnsFilter} onChange={(event) => setColumnsFilter(event.target.value)}><option value="all">Any layout</option><option value="1">One column</option><option value="2">Two columns</option></select></label>
          <div className="ri-template-color-filter">
            <strong className="ri-template-colors-label">Colors</strong>
            <div className="ri-template-colors" role="group" aria-label="Template accent color">
              {TEMPLATE_COLORS.map((color) => <button key={color.hex} type="button" className={`ri-template-color${templateColor === color.hex ? " selected" : ""}`} style={{ "--template-accent": color.hex }} aria-label={`${color.name} accent color`} aria-pressed={templateColor === color.hex} onClick={() => onUpdate("templateColor", color.hex)} />)}
            </div>
          </div>
        </div>
        <p className="ri-template-count">Showing <strong>{visibleTemplates.length}</strong> templates</p>
        <div className="ri-template-options">
          {visibleTemplates.map((item) => (
            <button key={item.id} type="button" className={`ri-template-option${templateChosen && template === item.id ? " selected" : ""}`} style={{ "--template-accent": templateColor }} aria-pressed={templateChosen && template === item.id} onClick={() => { onUpdate("template", item.id); setTemplateChosen(true); }}>
              <TemplatePaper template={item.id} color={templateColor} hasHeadshot={item.headshot} photoDataUrl={item.headshot ? profile.photoDataUrl : ""} />
              <span className="ri-template-option-copy">
                <strong>{item.name}</strong>
                <small>{item.description}</small>
                <span className="ri-template-option-action">{templateChosen && template === item.id ? <><Check size={15} /> Selected</> : "Choose template"}</span>
              </span>
            </button>
          ))}
        </div>
        {!visibleTemplates.length && <div className="ri-template-empty"><p>No templates match these filters.</p><button type="button" className="secondary-button" onClick={() => { setHeadshotFilter("all"); setGraphicsFilter("all"); setColumnsFilter("all"); }}>Clear filters</button></div>}
      </fieldset>}
      {templateChosen && <>
      <section className="ri-card ri-builder-form">
        <div className="ri-builder-form-heading"><div><h2>Verified resume details</h2><p>Fill in real information. Every section is optional except your name; don't add claims you cannot support.</p></div><button type="button" className="secondary-button" onClick={() => setTemplateChosen(false)}>Change template</button></div>
        <div className="ri-form-grid">
          <label>Full name<input value={profile.name || ""} onChange={(event) => onUpdate("name", event.target.value)} /></label>
          <label>Contact number<input type="tel" autoComplete="tel" value={profile.phone || ""} onChange={(event) => onUpdate("phone", event.target.value)} placeholder="+91 98765 43210" /></label>
          <label>Email address<input type="email" autoComplete="email" value={profile.email || ""} onChange={(event) => onUpdate("email", event.target.value)} placeholder="you@example.com" /></label>
          <label>LinkedIn profile<input value={profile.linkedin || ""} onChange={(event) => onUpdate("linkedin", event.target.value)} placeholder="linkedin.com/in/your-name" /></label>
          <label>GitHub profile<input value={profile.github || ""} onChange={(event) => onUpdate("github", event.target.value)} placeholder="github.com/your-name" /></label>
          <label className="ri-grid-full">Professional headline<input value={profile.headline || ""} onChange={(event) => onUpdate("headline", event.target.value)} placeholder="e.g. Computer science graduate" /></label>
        </div>
        {selectedTemplate.headshot && <section className="ri-photo-upload" aria-label="Resume photo">
          <div><strong>Profile photo</strong><small>Optional · resized in this browser and kept on this device.</small></div>
          <label className="secondary-button ri-photo-upload-button"><FileUp size={16} />{photoBusy ? "Preparing photo…" : profile.photoDataUrl ? "Change photo" : "Add photo"}<input type="file" accept="image/jpeg,image/png,image/webp" onChange={handlePhotoChange} disabled={photoBusy} /></label>
          {profile.photoDataUrl && <button type="button" className="text-link" onClick={() => { onUpdate("photoDataUrl", ""); setPhotoError(""); }}>Remove photo</button>}
          {photoError && <p className="ri-photo-error" role="alert">{photoError}</p>}
        </section>}
        <div className="ri-builder-sections">
          <h3>Reorder or remove sections</h3>
          {sections.map((section, index) => (
            <div
              key={section}
              className={`ri-builder-section${draggedIndex === index ? " dragging" : ""}`}
              draggable
              onDragStart={() => setDraggedIndex(index)}
              onDragOver={(event) => event.preventDefault()}
              onDrop={() => {
                if (draggedIndex === null) return;
                const next = [...sections];
                const [item] = next.splice(draggedIndex, 1);
                next.splice(index, 0, item);
                setSections(next);
                setDraggedIndex(null);
              }}
              onDragEnd={() => setDraggedIndex(null)}
            >
              <span className="ri-drag-handle" aria-hidden="true">⠿</span>
              <div className="ri-builder-section-fields">
                <label>{sectionLabel(section)}</label>
                {sectionKey(section) === "experience" && <ExperienceEntryEditor entries={experienceEntries} onChange={(value) => onUpdate("experienceEntries", value)} />}
                <textarea
                  rows={3}
                  value={profile[sectionKey(section)] || ""}
                  onChange={(event) => onUpdate(sectionKey(section), event.target.value)}
                  placeholder={sectionKey(section) === "experience" ? "Keep legacy or imported experience details here; these are preserved as entered." : `Add verified ${sectionLabel(section).toLowerCase()} details…`}
                  aria-label={`${sectionLabel(section)} details`}
                />
              </div>
              <div className="ri-section-actions">
                <div className="ri-reorder-buttons">
                  <button type="button" onClick={() => moveSection(index, -1)} aria-label={`Move ${sectionLabel(section)} up`} title="Move up">↑</button>
                  <button type="button" onClick={() => moveSection(index, 1)} aria-label={`Move ${sectionLabel(section)} down`} title="Move down">↓</button>
                </div>
                <button
                  type="button"
                  className="ri-delete-section"
                  onClick={() => removeSection(index)}
                  aria-label={`Remove ${sectionLabel(section)} section from this resume`}
                  title="Remove section from resume"
                >
                  <Trash2 size={15} aria-hidden="true" />
                </button>
              </div>
            </div>
          ))}
          {!sections.length && <p className="ri-experience-empty">All sections are removed. Add a section name below to continue.</p>}
        </div>
        <div className="ri-inline-form"><input value={customSection} onChange={(event) => setCustomSection(event.target.value)} placeholder="Custom section name" /><button type="button" className="secondary-button" onClick={addCustom}>Add section</button></div>
        <button type="button" className="secondary-button" onClick={() => setShowAssist((value) => !value)}><Lightbulb size={16} /> Writing assistant</button>
        {showAssist && <div className="ri-assist"><p>Paste a real bullet and we can format its punctuation. This local helper does not generate new achievements or facts.</p><textarea className="ri-textarea" rows={3} value={bullet} onChange={(event) => setBullet(event.target.value)} placeholder="Describe what you actually did…" />{bullet && <p><strong>Formatted draft:</strong> {rewriteBullet()}</p>}</div>}
        <div className="ri-builder-actions"><button type="button" className="primary-button" onClick={() => onBuilt(fullText)}>Save resume text <Check size={15} /></button><button type="button" className="secondary-button" onClick={() => onExport("pdf", fullText, template, SECTIONS, templateColor, profile.photoDataUrl)}><Download size={15} /> Print / Save PDF</button><button type="button" className="secondary-button" onClick={() => onExport("docx", fullText, template, sections.map(sectionLabel), templateColor, profile.photoDataUrl)}><Download size={15} /> Export DOCX</button></div>
      </section>
      <aside className={`ri-card ri-live-preview ri-template-${template}`} style={{ "--template-accent": templateColor }}>
        <span className="eyebrow">LIVE PREVIEW · {RESUME_TEMPLATES.find((item) => item.id === template)?.name.toUpperCase()}</span>
        <article className={`ri-resume-document ri-resume-document-${template}`}>
          <header className="ri-resume-document-header">
            {selectedTemplate.headshot && (profile.photoDataUrl
              ? <img className="ri-resume-avatar" src={profile.photoDataUrl} alt={`${profile.name || "Resume"} profile photo`} />
              : <span className="ri-resume-avatar" aria-label="Profile photo placeholder">{initials}</span>)}
            <div>
              <h2>{profile.name || "Your Name"}</h2>
              {profile.headline && <p className="ri-resume-headline">{profile.headline}</p>}
              <div className="ri-resume-contacts" aria-label="Resume contact information">
                {contactItems.map(({ key, label, value, Icon }) => <span key={key}><Icon size={13} aria-hidden="true" /><b>{label}:</b> {value}</span>)}
                {!contactItems.length && <span className="ri-resume-contact-empty">Add your phone, email, LinkedIn and GitHub in the form.</span>}
              </div>
            </div>
          </header>
          {["sidebar", "split", "portfolio"].includes(template) ? (
            <div className="ri-resume-document-columns">
              <div className="ri-resume-document-rail">{renderResumeSections(populatedSections.filter((section) => template === "portfolio" ? ["projects", "certifications"].includes(section.label.toLowerCase()) : secondarySectionNames.has(section.label.toLowerCase())))}</div>
              <div className="ri-resume-document-main">{renderResumeSections(populatedSections.filter((section) => template === "portfolio" ? !["projects", "certifications"].includes(section.label.toLowerCase()) : !secondarySectionNames.has(section.label.toLowerCase())))}</div>
            </div>
          ) : (
            <div className="ri-resume-document-main">{renderResumeSections(populatedSections)}</div>
          )}
          {!populatedSections.length && <p className="ri-disclaimer">Complete sections in the editor to build your preview.</p>}
        </article>
      </aside>
      </>}
    </div>
  );
}

function CareerProfile({ text, profile, onUpdate }) {
  const analysis = scanResume(text);
  const detected = analysis?.foundSkills || [];
  return <section className="ri-card"><span className="eyebrow">PROFILE DATA LAYER</span><h2>Your verified professional identity</h2><p>Detected items come from resume text matching. Confirm or edit them before using them elsewhere; absence in text is not proof you lack a skill.</p><div className="ri-form-grid"><label>Career level<input value={profile.level || ""} onChange={(event) => onUpdate("level", event.target.value)} placeholder="Set your career level" /></label><label>Industry preference<input value={profile.industry || ""} onChange={(event) => onUpdate("industry", event.target.value)} placeholder="Add your preferred industry" /></label><label>Target roles<input value={profile.targetRoles || ""} onChange={(event) => onUpdate("targetRoles", event.target.value)} placeholder="Roles you are exploring" /></label><label>Education<input value={profile.education || ""} onChange={(event) => onUpdate("education", event.target.value)} placeholder="Add verified education" /></label><label className="ri-grid-full">Strengths you can support<textarea rows={3} value={profile.strengths || ""} onChange={(event) => onUpdate("strengths", event.target.value)} /></label><label className="ri-grid-full">Areas you want to develop<textarea rows={3} value={profile.gaps || ""} onChange={(event) => onUpdate("gaps", event.target.value)} /></label></div><h3>Skills detected in resume text</h3><div className="ri-chip-list">{detected.length ? detected.map((skill) => <span key={skill}><Check size={13} />{skill}</span>) : <small>Upload a resume to detect recognized skill terms.</small>}</div><p className="ri-disclaimer">This profile is stored in local browser storage and is not yet shared across devices or wired into other modules.</p></section>;
}

export default ResumeIntelligence;
