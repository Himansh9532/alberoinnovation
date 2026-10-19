import assert from "node:assert/strict";
import test from "node:test";
import { createAdminCsv } from "./admin-export.js";

test("createAdminCsv exports dashboard totals and the displayed user fields", () => {
  const csv = createAdminCsv({
    userCount: 12,
    totalLogins: 45,
    totalResumeBytes: 2048,
    listedUserLimit: 100,
    users: [{
      name: "Asha Sharma",
      email: "asha@example.com",
      loginCount: 3,
      resumePresent: true,
      resumeBytes: 256,
      lastLoginAt: "2026-10-15T05:30:00.000Z",
    }],
  });

  assert.match(csv, /"Total user accounts","12"/);
  assert.match(csv, /"Recorded sign-ins","45"/);
  assert.match(csv, /"Resume text stored \(bytes\)","2048"/);
  assert.match(csv, /"Name","Email","Sign-ins","Resume","Resume text size \(bytes\)","Last login"/);
  assert.match(csv, /"Asha Sharma","asha@example\.com","3","Saved","256","2026-10-15T05:30:00\.000Z"/);
});

test("createAdminCsv escapes CSV syntax and neutralizes spreadsheet formulas in text fields", () => {
  const csv = createAdminCsv({
    userCount: 1,
    totalLogins: 0,
    totalResumeBytes: 0,
    listedUserLimit: 100,
    users: [{
      name: '=HYPERLINK("https://example.com","click")',
      email: "person@example.com,admin",
      loginCount: 0,
      resumePresent: false,
      resumeBytes: 0,
      lastLoginAt: null,
    }],
  });

  assert.match(csv, /"'=HYPERLINK\(""https:\/\/example\.com"",""click""\)","person@example\.com,admin","0","Not saved","0","—"/);
});
