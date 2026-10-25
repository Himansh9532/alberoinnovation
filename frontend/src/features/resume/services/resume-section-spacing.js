export const RESUME_SECTION_SPACING_STEP = 4;
export const MIN_RESUME_SECTION_SPACING = -12;
export const MAX_RESUME_SECTION_SPACING = 36;

function normalizeSectionName(sectionName) {
  const normalized = String(sectionName || "")
    .replace(/^custom:/i, "")
    .replace(/^#+\s*/, "")
    .replace(/\*\*/g, "")
    .replace(/[:：]+$/, "")
    .trim()
    .toLowerCase();
  if (normalized.includes("skill")) return "skills";
  if (normalized.includes("project")) return "projects";
  if (normalized.includes("educat")) return "education";
  if (normalized.includes("experience") || normalized.includes("employment")) return "experience";
  if (normalized.includes("summary") || normalized === "profile") return "summary";
  if (normalized.includes("certificat")) return "certifications";
  return normalized;
}

export function getResumeSectionSpacing(sectionSpacing, sectionName) {
  const key = normalizeSectionName(sectionName);
  const value = Number(sectionSpacing?.[key]);
  if (!Number.isFinite(value)) return 0;
  return Math.min(MAX_RESUME_SECTION_SPACING, Math.max(MIN_RESUME_SECTION_SPACING, value));
}

export function adjustResumeSectionSpacing(sectionSpacing, sectionName, direction) {
  const key = normalizeSectionName(sectionName);
  const adjustment = direction < 0 ? -RESUME_SECTION_SPACING_STEP : RESUME_SECTION_SPACING_STEP;
  return {
    ...sectionSpacing,
    [key]: Math.min(
      MAX_RESUME_SECTION_SPACING,
      Math.max(MIN_RESUME_SECTION_SPACING, getResumeSectionSpacing(sectionSpacing, key) + adjustment),
    ),
  };
}
