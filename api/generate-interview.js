import { handleGenerateInterviewRequest } from "../backend/server/interview-api.js";

export default async function generateInterview(request, response) {
  await handleGenerateInterviewRequest(request, response);
}
