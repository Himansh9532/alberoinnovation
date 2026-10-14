import { handleGenerateInterviewRequest } from "../backend/src/modules/interview/interview-api.js";

export default async function generateInterview(request, response) {
  await handleGenerateInterviewRequest(request, response);
}
