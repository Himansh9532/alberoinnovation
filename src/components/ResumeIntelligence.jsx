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
  FileText,
  FolderKanban,
  GraduationCap,
  Lightbulb,
  ListChecks,
  Plus,
  Search,
  ShieldCheck,
  Sparkles,
  Target,
  UserRound,
  UploadCloud,
} from "lucide-react";
import pdfWorkerUrl from "pdfjs-dist/build/pdf.worker.min.mjs?url";
import { getFirebaseIdToken } from "../data/firebaseAuth";
import { apiUrl } from "../data/api";

const PROFILE_KEY = "skillai-resume-profile";
const RESUME_KEY = "skillai-resume-text";
const VERSIONS_KEY = "skillai-resume-versions";
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
  summary: ["summary", "profile", "objective", "about"],
  experience: ["experience", "employment", "work history"],
  education: ["education", "academic"],
  projects: ["projects", "project"],
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

function scanResume(text) {
  if (!text.trim()) return null;
  const sections = Object.keys(SECTION_HEADINGS);
  const presentSections = sections.filter((section) => sectionExists(text, section));
  const foundSkills = SKILL_CATALOG.filter((skill) => includesTerm(text, skill));
  const quantifiedClaims = [...text.matchAll(/\b(?:increased|improved|reduced|managed|served|supported|achieved|delivered|grew)\b[^.\n]{0,100}\b\d+(?:\.\d+)?%?/gi)]
    .map((match) => match[0].trim());
  const bullets = text.split(/\r?\n/).filter((line) => /^\s*[•*-]\s+/.test(line));
  const actionBullets = bullets.filter((line) => /^\s*[•*-]\s+(?:built|created|developed|led|managed|improved|designed|analyzed|implemented|delivered|reduced|increased|launched)\b/i.test(line));
  return {
    foundSkills,
    presentSections,
    missingSections: sections.filter((section) => !presentSections.includes(section)),
    quantifiedClaims,
    bullets,
    actionBullets,
    wordCount: text.trim().split(/\s+/).length,
  };
}

function includesTerm(text, term) {
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`(^|[^a-z0-9])${escaped}(?=$|[^a-z0-9])`, "i").test(text);
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
  const token = await getFirebaseIdToken();
  const response = await fetch(apiUrl("/api/resume-assistant"), {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify(payload),
  });
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
  const endpoint = new URL(apiUrl("/api/jobs/india"), window.location.origin);
  if (location) endpoint.searchParams.set("where", location);
  const token = await getFirebaseIdToken();
  const response = await fetch(endpoint, {
    headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
  });
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

async function downloadDocx(title, text) {
  const { Document, HeadingLevel, Packer, Paragraph, TextRun } = await import("docx");
  const paragraphs = resumeTextToParagraphs(text).map((line, index) => new Paragraph({
    heading: index === 0 ? HeadingLevel.TITLE : undefined,
    children: [new TextRun({ text: line, bold: index === 0 })],
    spacing: { after: 140 },
  }));
  const document = new Document({
    sections: [{ properties: {}, children: paragraphs }],
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

function ResumeUpload({ onRead, status, busy, error, compact = false }) {
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
        aria-label={compact ? "Upload or replace resume" : "Choose a resume file"}
        disabled={busy}
        onChange={(event) => { const file = event.target.files?.[0]; event.currentTarget.value = ""; void handleFile(file); }}
      />
      {!compact && <span className="ri-upload-icon"><UploadCloud size={22} /></span>}
      <span className="ri-upload-content">
        <strong>
          {busy ? "Reading your resume…" : compact
            ? "Upload or replace resume"
            : isDragging
              ? "Drop to upload your resume"
              : "Drop your resume here"}
        </strong>
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
  const versionsStorageKey = storageKey(VERSIONS_KEY);
  const pageByRoute = {
    dashboard: ["Resume Dashboard", "Review the content extracted from your resume and choose a useful next step.", BarChart3],
    analyzer: ["Resume Analyzer", "Review text extracted from your resume and verify every finding.", FileText],
    builder: ["Resume Builder", "Create a clear, single-column resume from details you provide.", ListChecks],
    optimizer: ["Job Description Match", "Find exact catalog terms shared with a job description.", Target],
    "job-match": ["Job Match", "Find live listings and optionally rank them against your resume with AI.", BriefcaseBusiness],
    tailor: ["Resume Tailor", "Focus an existing resume on one role without adding new claims.", Sparkles],
    "skill-gaps": ["Skill Gap Analysis", "Compare evidenced skills with a target role.", GraduationCap],
    "project-analyzer": ["Project Analyzer", "Evaluate project evidence and describe it professionally.", FolderKanban],
    profile: ["Career Profile", "Your reusable professional profile, grounded in your resume.", UserRound],
    versions: ["Resume Versions", "Keep and compare role-specific resume versions.", FileText],
    package: ["Career Package", "Create career materials from verified profile information.", BriefcaseBusiness],
  };
  const [resumeText, setResumeText] = useState(() => window.localStorage.getItem(resumeStorageKey) || "");
  const [uploadStatus, setUploadStatus] = useState("");
  const [uploadError, setUploadError] = useState("");
  const [isReading, setIsReading] = useState(false);
  const [profile, setProfile] = useState(() => readStored(profileStorageKey, {}));
  const [notice, setNotice] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [jobDescription, setJobDescription] = useState("");
  const [aiLoading, setAiLoading] = useState("");
  const [aiError, setAiError] = useState("");
  const [aiResults, setAiResults] = useState({});
  const [versions, setVersions] = useState(() => readStored(versionsStorageKey, []));
  const [comparisonIds, setComparisonIds] = useState(["", ""]);
  const [project, setProject] = useState({ name: "", description: "", github: "", liveUrl: "", documentation: "", technologies: "" });

  useEffect(() => {
    setAiError("");
  }, [route]);

  const analysis = useMemo(() => scanResume(resumeText), [resumeText]);
  const role = ROLES.find((item) => item.name === targetRole) || null;
  const jobSkills = useMemo(() => SKILL_CATALOG.filter((skill) => includesTerm(jobDescription, skill)), [jobDescription]);
  const matchedJobSkills = jobSkills.filter((skill) => includesTerm(resumeText, skill));
  const missingJobSkills = jobSkills.filter((skill) => !includesTerm(resumeText, skill));
  const requiredRoleSkills = (role?.skills || []).filter((skill) => includesTerm(jobDescription, skill));
  const roleMatches = ROLES.map((item) => {
    const matches = item.skills.filter((skill) => includesTerm(resumeText, skill));
    return { ...item, matches, missing: item.skills.filter((skill) => !matches.includes(skill)) };
  }).sort((first, second) => second.matches.length - first.matches.length);
  const targetRoleMatch = roleMatches.find((item) => item.name === targetRole);
  const comparisonVersions = comparisonIds.map((id) => versions.find((version) => String(version.id) === id) || null);
  const comparisonAnalyses = comparisonVersions.map((version) => version ? scanResume(version.text) : null);

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
      setAiResults((current) => ({ ...current, [action]: result }));
    } catch (error) {
      setAiError(error.message || "Resume AI could not complete this request. Please try again.");
    } finally {
      setAiLoading("");
    }
  };

  const applyTailoredDraft = () => {
    const draft = aiResults.tailor?.draft;
    if (!draft) return;
    const now = new Date().toISOString();
    const nextVersions = [
      ...versions,
      { id: Date.now(), label: "Before AI tailoring", role: targetRole || "Original resume", text: resumeText, date: now },
    ];
    setVersions(nextVersions);
    writeStored(versionsStorageKey, nextVersions);
    handleResumeRead(draft, "AI-tailored draft saved locally. Your original is available in Resume Versions.", false, "");
  };

  const addVersion = () => {
    if (!resumeText.trim()) {
      setNotice("Upload or build a resume before saving a version.");
      return;
    }
    const next = [...versions, { id: Date.now(), label: `Resume v${versions.length + 1}`, role: targetRole || "General resume", text: resumeText, date: new Date().toISOString() }];
    setVersions(next);
    writeStored(versionsStorageKey, next);
    setNotice("A resume snapshot was saved on this device.");
  };

  const exportResume = async (format, text = resumeText) => {
    if (!text.trim()) {
      setNotice("Add or upload resume content before exporting.");
      return;
    }
    if (format === "docx") {
      await downloadDocx("SkillAI Resume", text);
      return;
    }
    window.print();
  };

  const [title, description, Icon] = pageByRoute[route] || pageByRoute.dashboard;

  return (
    <main className="page-shell ri-page">
      <div className="wrap ri-layout">
        <aside className="ri-sidebar">
          <div className="ri-sidebar-brand"><span><FileText size={19} /></span><div><strong>Resume Intelligence</strong><small>Career workspace</small></div></div>
          {Object.entries({
            RESUME: [["dashboard", "Resume Dashboard"], ["analyzer", "Resume Analyzer"], ["builder", "Resume Builder"]],
            OPTIMIZATION: [["optimizer", "Job Description Match"], ["job-match", "Job Match"], ["tailor", "Resume Tailor"]],
            "CAREER INTELLIGENCE": [["skill-gaps", "Skill Gap Analysis"], ["project-analyzer", "Project Analyzer"], ["profile", "Career Profile"]],
            MANAGEMENT: [["versions", "Resume Versions"], ["package", "Career Package"]],
          }).map(([group, links]) => (
            <div className="ri-sidebar-group" key={group}>
              <span>{group}</span>
              {links.map(([slug, label]) => (
                <Link key={slug} to={`/resume/${slug}`} className={`ri-sidebar-link${route === slug ? " active" : ""}`}>{label}<ChevronRight size={14} /></Link>
              ))}
            </div>
          ))}
          <div className="ri-sidebar-privacy"><ShieldCheck size={16} /><span>Your resume stays here unless you choose an AI action.</span></div>
        </aside>

        <section className="ri-content">
          <header className="ri-page-heading">
            <div><span className="eyebrow">CAREER WORKSPACE / RESUME</span><h1><Icon size={25} />{title}</h1><p>{description}</p></div>
            {route !== "builder" && <Link to="/resume/builder" className="secondary-button">{resumeText ? "Edit resume" : "Build a resume"} <ArrowRight size={16} /></Link>}
          </header>

          {notice && <div className="ri-notice" role="status"><Check size={16} />{notice}</div>}
          {aiError && route !== "job-match" && <p className="ri-job-error" role="alert">{aiError}</p>}

          {(route === "dashboard" || route === "analyzer") ? (
            <section className={`ri-upload-panel${resumeText ? " has-resume" : " is-empty"}`}>
              <div className="ri-upload-copy">
                <span className="ri-upload-kicker">{resumeText ? "RESUME READY" : "START WITH YOUR RESUME"}</span>
                <strong>{resumeText ? "Your resume is ready to review" : "Bring your experience into focus"}</strong>
                <p>{resumeText ? "Review the extracted text before using career tools. Your file stays on this device unless you choose an AI action." : "Upload an existing resume and we’ll extract its text locally, so you can review it before using career tools."}</p>
                <span className="ri-upload-privacy"><ShieldCheck size={15} /> Stored in this browser · sent for AI review only when you choose an AI action</span>
                {resumeText && <button type="button" className="ri-clear-button" onClick={clearResume}>Remove saved resume</button>}
              </div>
              <ResumeUpload onRead={handleResumeRead} status={uploadStatus} busy={isReading} error={uploadError} />
            </section>
          ) : (
            <section className="ri-resume-status">
              <span className={`ri-status-dot${resumeText ? " ready" : ""}`} />
              <span>{resumeText ? "Resume text available on this device" : "No resume text added yet"}</span>
              {route === "job-match" && <ResumeUpload onRead={handleResumeRead} status={uploadStatus} busy={isReading} error={uploadError} compact />}
              {route !== "builder" && route !== "job-match" && <Link to="/resume/analyzer">{resumeText ? "Review extracted text" : "Add a resume"} <ArrowRight size={14} /></Link>}
            </section>
          )}

          {route === "dashboard" && (
            <>
              {analysis ? (
                <>
                  <div className="ri-dashboard-section-heading">
                    <div><span className="eyebrow">DOCUMENT OVERVIEW</span><h2>Resume content at a glance</h2><p>Counts below are calculated from extracted text—not quality scores or hiring predictions.</p></div>
                    <TargetRoleSelect value={targetRole} onChange={(value) => { setTargetRole(value); setAiResults((current) => ({ ...current, tailor: null, "skill-gaps": null })); }} />
                  </div>
                  <div className="ri-score-grid">
                    <MetricCard label="Words extracted" value={analysis.wordCount} note="Tokens found in the uploaded document" />
                    <MetricCard label="Recognized skill terms" value={analysis.foundSkills.length} note="Exact terms from the platform’s role catalog" />
                    <MetricCard label="Bullet lines" value={analysis.bullets.length} note="Lines with a standard bullet marker" />
                    <MetricCard label="Outcome phrases" value={analysis.quantifiedClaims.length} note="Limited pattern; review each claim yourself" />
                  </div>
                  <div className="ri-dashboard-panels">
                    <article className="ri-card ri-dashboard-card">
                      <div className="ri-card-title-row"><span className="ri-card-icon"><FileText size={18} /></span><div><h2>Extracted sections</h2><p>Standard headings recognized in the text</p></div></div>
                      {analysis.presentSections.length ? <div className="ri-chip-list">{analysis.presentSections.map((section) => <span key={section}><Check size={13} />{section}</span>)}</div> : <p>No standard headings were detected. Check the extracted text before editing the original resume.</p>}
                      <Link to="/resume/analyzer" className="text-link">Review extracted text <ArrowRight size={15} /></Link>
                    </article>
                    <article className="ri-card ri-dashboard-card">
                      <div className="ri-card-title-row"><span className="ri-card-icon target"><Target size={18} /></span><div><h2>Role term check</h2><p>{targetRoleMatch ? `${targetRoleMatch.name} · ${targetRoleMatch.sector}` : "Choose a role to compare catalog terms"}</p></div></div>
                      {targetRoleMatch ? <><strong className="ri-match-count">{targetRoleMatch.matches.length} of {targetRoleMatch.skills.length} catalog terms found</strong><InfoRows label="Terms found" values={targetRoleMatch.matches} empty="No terms from this role were found in the extracted text." /></> : <p>This is a keyword check only; it does not determine whether a role is right for you.</p>}
                    </article>
                  </div>
                  <div className="ri-workflow-card">
                    <div><span className="eyebrow">NEXT STEPS</span><h2>Continue working on your resume</h2><p>Review extraction first, then use a tool that matches your current goal.</p></div>
                    <div className="ri-workflow-links">
                      <Link to="/resume/analyzer"><span>01</span><strong>Review resume text</strong><ArrowRight size={15} /></Link>
                      <Link to="/resume/optimizer"><span>02</span><strong>Compare with a job description</strong><ArrowRight size={15} /></Link>
                      <Link to="/resume/builder"><span>03</span><strong>Edit or build a resume</strong><ArrowRight size={15} /></Link>
                    </div>
                  </div>
                </>
              ) : (
                <section className="ri-empty-dashboard">
                  <span className="ri-empty-icon"><FileText size={25} /></span>
                  <span className="eyebrow">YOUR RESUME WORKSPACE</span>
                  <h2>Start with your own resume</h2>
                  <p>Upload a file to inspect its extracted text, compare terms with a job description, and build role-specific resume drafts. No example scores or sample resume data are shown.</p>
                  <ul><li>PDF, DOC, DOCX, or TXT</li><li>Maximum file size: 10 MB</li><li>Text extraction stays in this browser</li></ul>
                  <Link to="/resume/builder" className="secondary-button">Start with the resume builder <ArrowRight size={16} /></Link>
                </section>
              )}
            </>
          )}

          {route === "analyzer" && (
            <>
              <div className="ri-columns">
                <article className="ri-card"><h2>Headings not detected in extracted text</h2>{analysis ? <>{analysis.missingSections.length ? <ul>{analysis.missingSections.map((item) => <li key={item}>{item}</li>)}</ul> : <p>All standard headings in the limited built-in list were detected.</p>}<p className="ri-disclaimer">This is a text-parser result, not a finding that your resume is missing these sections. Review the extracted text and the original file.</p></> : <p>Upload a resume to inspect its extracted text.</p>}</article>
                <article className="ri-card"><h2>Text patterns detected</h2>{analysis ? <ul>{[
                  `${analysis.wordCount} words extracted`,
                  `${analysis.foundSkills.length} recognized catalog terms`,
                  `${analysis.bullets.length} bullet lines`,
                  `${analysis.actionBullets.length} bullet lines beginning with a limited set of action verbs`,
                  `${analysis.quantifiedClaims.length} phrases matching a limited outcome-and-number pattern`,
                ].map((item) => <li key={item}>{item}</li>)}</ul> : <p>Detected text patterns will appear here after upload.</p>}<p className="ri-disclaimer">These are counts only. No grammar, career-gap, ATS, recruiter, or claim-verification analysis is performed.</p></article>
              </div>
              <article className="ri-card"><h2>Review the source, not just the parser</h2><p>Check the extracted text against the original resume. If a heading or line is missing here, verify the source PDF before changing your resume.</p>{analysis && <details className="ri-extracted-text"><summary>Review extracted resume text</summary><pre>{resumeText}</pre></details>}</article>
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

          {route === "optimizer" && (
            <section className="ri-card">
              <h2>Compare resume terms with a job description</h2><p>Paste the job description. This tool reports exact matches for terms in its built-in catalog; it does not calculate an ATS score or judge your suitability.</p>
              <TargetRoleSelect value={targetRole} onChange={(value) => { setTargetRole(value); setAiResults((current) => ({ ...current, tailor: null })); }} />
              <textarea className="ri-textarea" rows={8} maxLength={12000} value={jobDescription} onChange={(event) => { setJobDescription(event.target.value); setAiResults((current) => ({ ...current, tailor: null })); }} placeholder="Paste the full job description here…" />
              {jobDescription && <div className="ri-optimizer-results"><MetricCard label="Catalog terms found in job description" value={jobSkills.length} note="Exact built-in cross-sector skill terms" /><MetricCard label="Those terms also found in resume" value={matchedJobSkills.length} note="Text matches only; not an ATS score" /><InfoRows label="Selected-role terms found in the job description" values={requiredRoleSkills} empty={role ? "No selected-role catalog terms found in the description." : "Choose a target role to check role-specific terms."} /><InfoRows label="Catalog terms in both texts" values={matchedJobSkills} empty="No exact catalog terms found in both texts." /><InfoRows label="Catalog terms in job description but not resume text" values={missingJobSkills} empty="No additional catalog terms detected in the job description." /><InfoRows label="Experience, education, job title, and industry" values={["Not evaluated. Compare these requirements against the original job description and your verified experience."]} empty="" /></div>}
              <Link to="/resume/tailor" className="primary-button">Optimize relevant sections <ArrowRight size={16} /></Link>
            </section>
          )}

          {route === "job-match" && (
            <JobSearch analysis={analysis} resumeText={resumeText} />
          )}

          {route === "tailor" && (
            <section className="ri-card">
              <h2>Tailor only what is relevant</h2><p>Share a job description to get an AI-assisted role-focused draft based only on facts already in your resume. Review every change before using it.</p>
              <TargetRoleSelect value={targetRole} onChange={(value) => { setTargetRole(value); setAiResults((current) => ({ ...current, tailor: null })); }} />
              <textarea className="ri-textarea" rows={7} maxLength={12000} value={jobDescription} onChange={(event) => { setJobDescription(event.target.value); setAiResults((current) => ({ ...current, tailor: null })); }} placeholder="Paste a specific job description…" />
              <div className="ri-before-after"><article><span className="eyebrow">BEFORE · SOURCE TEXT</span><pre>{resumeText || "Upload or create a resume to begin."}</pre></article><article><span className="eyebrow">KEYWORD CHECK · EXACT TERMS</span><pre>{resumeText ? (matchedJobSkills.length ? `Catalog terms found in both the job description and resume text:\n${matchedJobSkills.join("\n")}\n\nThis exact-term check is separate from the AI-tailored draft below.` : "No matching catalog terms were detected. AI can still review the full description and resume for relevant evidence.") : "Your source resume will appear here after upload."}</pre></article></div>
              <div className="ri-ai-action-row"><button type="button" className="primary-button" onClick={() => void runAI("tailor", { targetRole, jobDescription })} disabled={Boolean(aiLoading) || resumeText.trim().length < 80 || jobDescription.trim().length < 40}>{aiLoading === "tailor" ? "Creating a tailored draft…" : "Create AI-tailored draft"} <Sparkles size={16} /></button><span className="ri-ai-privacy-note"><ShieldCheck size={14} /> Resume and job description are sent to AI only when you choose this action.</span></div>
              {aiResults.tailor && <div className="ri-ai-tailor-result">
                <div className="ri-section-heading"><div><span className="eyebrow">AI-GENERATED DRAFT</span><h3>Review before applying</h3></div><button type="button" className="secondary-button" onClick={applyTailoredDraft}>Use draft and save original version</button></div>
                <pre>{aiResults.tailor.draft}</pre>
                <div className="ri-columns"><article><h3>Changes made</h3><ul>{aiResults.tailor.changes.map((item, index) => <li key={`change-${index}`}>{item}</li>)}</ul></article><article><h3>Evidence to review</h3>{aiResults.tailor.reviewNotes.length ? <ul>{aiResults.tailor.reviewNotes.map((item, index) => <li key={`review-${index}`}>{item}</li>)}</ul> : <p>No specific missing-evidence notes returned. Still verify every detail against your original.</p>}</article></div>
                <p className="ri-disclaimer">AI can still introduce errors. Applying the draft saves your current resume to Resume Versions first; verify all claims before exporting or applying.</p>
              </div>}
              <p className="ri-disclaimer">AI may miss or misinterpret information. No experience, skills, metrics, or project results should be used unless you can verify them.</p>
            </section>
          )}

          {route === "skill-gaps" && (
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

          {route === "project-analyzer" && (
            <section className="ri-card"><h2>Describe a real project</h2><div className="ri-form-grid">{[
              ["name", "Project name", "text"], ["github", "GitHub URL", "url"], ["liveUrl", "Live project URL", "url"], ["documentation", "Documentation URL", "url"], ["technologies", "Technologies you used", "text"],
            ].map(([key, label, type]) => <label key={key}>{label}<input type={type} value={project[key]} onChange={(event) => setProject((current) => ({ ...current, [key]: event.target.value }))} /></label>)}</div><label className="ri-field-block">What did you build? Include only verifiable details.<textarea className="ri-textarea" rows={5} value={project.description} onChange={(event) => setProject((current) => ({ ...current, description: event.target.value }))} /></label>
              {project.description && <div className="ri-columns"><MetricCard label="Project details provided" value={`${Object.values(project).filter((value) => value.trim()).length} of ${Object.keys(project).length}`} note="Count of non-empty form fields; repository and code are not inspected" /><article className="ri-card"><h2>Draft using your wording</h2><p>{`${project.name || "Project"}: ${project.description.trim()}${project.technologies ? ` Technologies: ${project.technologies}.` : ""}`}</p><small>This draft only combines text you entered. It does not verify links, technologies, or outcomes.</small></article></div>}
            </section>
          )}

          {route === "profile" && (
            <CareerProfile text={resumeText} profile={profile} onUpdate={updateProfile} />
          )}

          {route === "versions" && (
            <section className="ri-card">
              <div className="ri-section-heading"><div><span className="eyebrow">LOCAL VERSION HISTORY</span><h2>Saved resume snapshots</h2></div><button type="button" className="secondary-button" onClick={addVersion}><Plus size={16} /> Save current version</button></div>
              {versions.length ? <div className="ri-version-list">{versions.map((version) => { const versionAnalysis = scanResume(version.text); return <article key={version.id}><span><strong>{version.label}</strong><small>{version.role} · {new Date(version.date).toLocaleDateString()}</small></span><span>{versionAnalysis?.wordCount ?? 0} extracted words</span><button type="button" className="text-link" onClick={() => { setResumeText(version.text); window.localStorage.setItem(resumeStorageKey, version.text); setNotice(`${version.label} loaded.`); }}>Load version</button></article>; })}</div> : <p>No saved versions yet. Save a snapshot after uploading or editing a resume.</p>}
              {versions.length > 1 && <>
                <h3>Compare versions</h3>
                <div className="ri-form-grid">
                  {[0, 1].map((index) => <label key={index}>Version {index + 1}<select value={comparisonIds[index]} onChange={(event) => setComparisonIds((current) => current.map((id, slot) => slot === index ? event.target.value : id))}><option value="">Select a version</option>{versions.map((version) => <option key={version.id} value={String(version.id)} disabled={comparisonIds[1 - index] === String(version.id)}>{version.label} · {version.role}</option>)}</select></label>)}
                </div>
                {comparisonVersions[0] && comparisonVersions[1] && <>
                  <div className="ri-score-grid">
                    <MetricCard label="Extracted word count" value={`${comparisonAnalyses[0].wordCount} → ${comparisonAnalyses[1].wordCount}`} note="Counts from each saved text snapshot" />
                    <MetricCard label="Recognized catalog terms" value={`${comparisonAnalyses[0].foundSkills.length} → ${comparisonAnalyses[1].foundSkills.length}`} note="Built-in skill terms present in each text" />
                    <MetricCard label="Detected section headings" value={`${comparisonAnalyses[0].presentSections.length} → ${comparisonAnalyses[1].presentSections.length}`} note="Headings detected in extracted text" />
                    <MetricCard label="Bullet lines" value={`${comparisonAnalyses[0].bullets.length} → ${comparisonAnalyses[1].bullets.length}`} note="Lines beginning with bullet markers" />
                  </div>
                  <p className="ri-disclaimer">Changes reflect text and heuristic signals only. Review both versions for accuracy and relevance before applying.</p>
                </>}
              </>}
              <p className="ri-disclaimer">These comparisons show text counts only. They do not estimate ATS results, hiring outcomes, or resume quality.</p>
            </section>
          )}

          {route === "package" && (
            <CareerPackage profile={profile} text={resumeText} />
          )}
        </section>
      </div>
    </main>
  );
}

function TargetRoleSelect({ value, onChange }) {
  return <label className="ri-role-select">Sector and target role<select value={value} onChange={(event) => onChange(event.target.value)}><option value="">Choose a sector and role</option>{SECTORS.map((sector) => <optgroup label={sector} key={sector}>{ROLES.filter((role) => role.sector === sector).map((role) => <option key={role.name} value={role.name}>{role.name}</option>)}</optgroup>)}</select></label>;
}

function InfoRows({ label, values, empty }) {
  return <div className="ri-info-row"><strong>{label}</strong>{values.length ? <div>{values.map((value) => <span key={value}>{value}</span>)}</div> : <small>{empty}</small>}</div>;
}

function ResumeBuilder({ profile, onUpdate, onExport, onBuilt }) {
  const [customSection, setCustomSection] = useState("");
  const [sections, setSections] = useState(SECTIONS);
  const [draggedIndex, setDraggedIndex] = useState(null);
  const [showAssist, setShowAssist] = useState(false);
  const [bullet, setBullet] = useState("");
  const sectionKey = (section) => section.startsWith("custom:") ? section : section.toLowerCase();
  const sectionLabel = (section) => section.startsWith("custom:") ? section.slice(7) : section;
  const fullText = [
    profile.name || "Your Name",
    profile.email || "",
    profile.headline || "",
    ...sections.filter((section) => profile[sectionKey(section)]).map((section) => `${sectionLabel(section)}\n${profile[sectionKey(section)]}`),
  ].filter(Boolean).join("\n\n");
  const moveSection = (index, direction) => {
    const next = [...sections];
    const target = index + direction;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    setSections(next);
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
    <div className="ri-builder-layout">
      <section className="ri-card ri-builder-form">
        <h2>Verified resume details</h2><p>Fill in real information. Every section is optional except your name; don't add claims you cannot support.</p>
        <div className="ri-form-grid"><label>Full name<input value={profile.name || ""} onChange={(event) => onUpdate("name", event.target.value)} /></label><label>Email<input type="email" value={profile.email || ""} onChange={(event) => onUpdate("email", event.target.value)} /></label><label className="ri-grid-full">Professional headline<input value={profile.headline || ""} onChange={(event) => onUpdate("headline", event.target.value)} placeholder="e.g. Computer science graduate" /></label></div>
        <div className="ri-builder-sections"><h3>Reorder sections</h3>{sections.map((section, index) => <div key={section} className={`ri-builder-section${draggedIndex === index ? " dragging" : ""}`} draggable onDragStart={() => setDraggedIndex(index)} onDragOver={(event) => event.preventDefault()} onDrop={() => { if (draggedIndex === null) return; const next = [...sections]; const [item] = next.splice(draggedIndex, 1); next.splice(index, 0, item); setSections(next); setDraggedIndex(null); }} onDragEnd={() => setDraggedIndex(null)}><span className="ri-drag-handle">⠿</span><label>{sectionLabel(section)}<textarea rows={3} value={profile[sectionKey(section)] || ""} onChange={(event) => onUpdate(sectionKey(section), event.target.value)} placeholder={`Add verified ${sectionLabel(section).toLowerCase()} details…`} /></label><div className="ri-reorder-buttons"><button type="button" onClick={() => moveSection(index, -1)} aria-label={`Move ${sectionLabel(section)} up`}>↑</button><button type="button" onClick={() => moveSection(index, 1)} aria-label={`Move ${sectionLabel(section)} down`}>↓</button></div></div>)}</div>
        <div className="ri-inline-form"><input value={customSection} onChange={(event) => setCustomSection(event.target.value)} placeholder="Custom section name" /><button type="button" className="secondary-button" onClick={addCustom}>Add section</button></div>
        <button type="button" className="secondary-button" onClick={() => setShowAssist((value) => !value)}><Lightbulb size={16} /> Writing assistant</button>
        {showAssist && <div className="ri-assist"><p>Paste a real bullet and we can format its punctuation. This local helper does not generate new achievements or facts.</p><textarea className="ri-textarea" rows={3} value={bullet} onChange={(event) => setBullet(event.target.value)} placeholder="Describe what you actually did…" />{bullet && <p><strong>Formatted draft:</strong> {rewriteBullet()}</p>}</div>}
        <div className="ri-builder-actions"><button type="button" className="primary-button" onClick={() => onBuilt(fullText)}>Save resume text <Check size={15} /></button><button type="button" className="secondary-button" onClick={() => onExport("pdf", fullText)}><Download size={15} /> Print / Save PDF</button><button type="button" className="secondary-button" onClick={() => onExport("docx", fullText)}><Download size={15} /> Export DOCX</button></div>
      </section>
      <aside className="ri-card ri-live-preview"><span className="eyebrow">LIVE PREVIEW · SINGLE-COLUMN TEMPLATE</span><h2>{profile.name || "Your Name"}</h2><p>{profile.headline || profile.email || "Professional headline · Email address"}</p>{sections.map((section) => profile[sectionKey(section)] && <section key={section}><h3>{sectionLabel(section)}</h3><p>{profile[sectionKey(section)]}</p></section>)}{!sections.some((section) => profile[sectionKey(section)]) && <p className="ri-disclaimer">Complete sections in the editor to build your preview.</p>}</aside>
    </div>
  );
}

function CareerProfile({ text, profile, onUpdate }) {
  const analysis = scanResume(text);
  const detected = analysis?.foundSkills || [];
  return <section className="ri-card"><span className="eyebrow">PROFILE DATA LAYER</span><h2>Your verified professional identity</h2><p>Detected items come from resume text matching. Confirm or edit them before using them elsewhere; absence in text is not proof you lack a skill.</p><div className="ri-form-grid"><label>Career level<input value={profile.level || ""} onChange={(event) => onUpdate("level", event.target.value)} placeholder="Set your career level" /></label><label>Industry preference<input value={profile.industry || ""} onChange={(event) => onUpdate("industry", event.target.value)} placeholder="Add your preferred industry" /></label><label>Target roles<input value={profile.targetRoles || ""} onChange={(event) => onUpdate("targetRoles", event.target.value)} placeholder="Roles you are exploring" /></label><label>Education<input value={profile.education || ""} onChange={(event) => onUpdate("education", event.target.value)} placeholder="Add verified education" /></label><label className="ri-grid-full">Strengths you can support<textarea rows={3} value={profile.strengths || ""} onChange={(event) => onUpdate("strengths", event.target.value)} /></label><label className="ri-grid-full">Areas you want to develop<textarea rows={3} value={profile.gaps || ""} onChange={(event) => onUpdate("gaps", event.target.value)} /></label></div><h3>Skills detected in resume text</h3><div className="ri-chip-list">{detected.length ? detected.map((skill) => <span key={skill}><Check size={13} />{skill}</span>) : <small>Upload a resume to detect recognized skill terms.</small>}</div><p className="ri-disclaimer">This profile is stored in local browser storage and is not yet shared across devices or wired into other modules.</p></section>;
}

function CareerPackage({ profile, text }) {
  const [kind, setKind] = useState("LinkedIn headline");
  const headline = profile.headline || "";
  const summary = profile.summary || "";
  const role = profile.targetRoles || "";
  const packageCopy = {
    "LinkedIn headline": [headline, role].filter(Boolean).join(" · "),
    "LinkedIn About": [summary, profile.strengths].filter(Boolean).join("\n\n"),
    "Cover letter": [profile.name, role && `I am applying for ${role}.`, summary].filter(Boolean).join("\n\n"),
    "Professional bio": [headline, summary, profile.education].filter(Boolean).join("\n\n"),
    "Portfolio summary": profile.projects || "",
    "GitHub profile summary": profile.skills || "",
    "Elevator pitch": [headline, summary].filter(Boolean).join(" "),
    "Interview introduction": [profile.name, headline, summary].filter(Boolean).join(". "),
  };
  return <section className="ri-card"><span className="eyebrow">ONE PROFILE · REUSABLE MATERIAL</span><h2>Career package</h2><p>Drafts use only information entered in your profile or resume builder. Blank profile facts are left blank; review every draft before using it.</p><div className="ri-package-tabs">{Object.keys(packageCopy).map((item) => <button type="button" key={item} className={kind === item ? "active" : ""} onClick={() => setKind(item)}>{item}</button>)}</div><label className="ri-field-block">{kind}<textarea className="ri-textarea" rows={9} readOnly value={packageCopy[kind] || (text ? "Add details in Career Profile or Resume Builder to create this draft from your information." : "Upload or build your resume, then add verified profile details.")} /></label><p className="ri-disclaimer">Drafting is template-based here, not AI-generated. No credentials, skills, or accomplishments are invented.</p></section>;
}

export default ResumeIntelligence;
