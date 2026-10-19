function escapeCsvCell(value) {
  const text = String(value ?? "");
  const safeText = /^[\t\r\n ]*[=+\-@]/.test(text) ? `'${text}` : text;
  return `"${safeText.replace(/"/g, '""')}"`;
}

function csvRow(values) {
  return values.map(escapeCsvCell).join(",");
}

export function createAdminCsv(stats) {
  const summaryRows = [
    ["SkillAI Admin Summary"],
    ["Total user accounts", stats.userCount],
    ["Recorded sign-ins", stats.totalLogins],
    ["Resume text stored (bytes)", stats.totalResumeBytes],
    ["Listed user limit", stats.listedUserLimit],
  ];
  const userRows = [
    [],
    ["Recent user accounts"],
    ["Name", "Email", "Sign-ins", "Resume", "Resume text size (bytes)", "Last login"],
    ...stats.users.map((user) => [
      user.name,
      user.email || "—",
      user.loginCount,
      user.resumePresent ? "Saved" : "Not saved",
      user.resumeBytes,
      user.lastLoginAt || "—",
    ]),
  ];

  return [...summaryRows, ...userRows].map(csvRow).join("\r\n");
}
