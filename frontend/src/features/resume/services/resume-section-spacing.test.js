import assert from "node:assert/strict";
import test from "node:test";
import {
  adjustResumeSectionSpacing,
  getResumeSectionSpacing,
  MAX_RESUME_SECTION_SPACING,
  MIN_RESUME_SECTION_SPACING,
} from "./resume-section-spacing.js";

test("adjusts spacing for one section without changing other section values", () => {
  const spacing = { projects: 8, education: -4 };
  assert.deepEqual(adjustResumeSectionSpacing(spacing, "Projects", 1), {
    projects: 12,
    education: -4,
  });
  assert.equal(getResumeSectionSpacing(spacing, "education"), -4);
});

test("clamps spacing changes to the supported limits", () => {
  assert.equal(getResumeSectionSpacing({ projects: MAX_RESUME_SECTION_SPACING + 4 }, "projects"), MAX_RESUME_SECTION_SPACING);
  assert.equal(
    adjustResumeSectionSpacing({ projects: MAX_RESUME_SECTION_SPACING }, "projects", 1).projects,
    MAX_RESUME_SECTION_SPACING,
  );
  assert.equal(
    adjustResumeSectionSpacing({ projects: MIN_RESUME_SECTION_SPACING }, "projects", -1).projects,
    MIN_RESUME_SECTION_SPACING,
  );
});

test("uses zero spacing when there is no stored value", () => {
  assert.equal(getResumeSectionSpacing({}, "projects"), 0);
  assert.equal(getResumeSectionSpacing({ projects: "not a number" }, "projects"), 0);
});

test("matches common section heading variants to saved spacing values", () => {
  assert.equal(getResumeSectionSpacing({ skills: 12 }, "Technical Skills"), 12);
  assert.equal(getResumeSectionSpacing({ experience: 8 }, "Professional Experience"), 8);
});
