import { handleGenerateAssessmentRequest } from "../backend/server/interview-api.js";

export default async function skillAssessment(request, response) {
  await handleGenerateAssessmentRequest(request, response);
}
