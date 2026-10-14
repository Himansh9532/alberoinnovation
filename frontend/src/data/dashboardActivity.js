const INTERVIEW_RESULTS_KEY = "skillai-interview-results";
const ASSESSMENT_RESULTS_KEY = "skillai-assessment-results";

function readOwnedResults(key, email) {
  const serialized = window.localStorage.getItem(key);
  if (!serialized) return [];
  const results = JSON.parse(serialized);
  if (!Array.isArray(results)) throw new Error("Saved activity data has an invalid format.");
  return results
    .filter((item) => item?.ownerEmail === email && Number.isFinite(item.score))
    .sort((first, second) => new Date(second.completedAt || second.evaluatedAt || 0) - new Date(first.completedAt || first.evaluatedAt || 0));
}

export function getDashboardActivity(email) {
  return {
    interviews: readOwnedResults(INTERVIEW_RESULTS_KEY, email),
    assessments: readOwnedResults(ASSESSMENT_RESULTS_KEY, email),
  };
}

export function getCurrentUserEmail() {
  const sessionText = window.localStorage.getItem("skillai-auth");
  if (!sessionText) return "";
  const session = JSON.parse(sessionText);
  return typeof session?.email === "string" ? session.email.trim().toLowerCase() : "";
}
