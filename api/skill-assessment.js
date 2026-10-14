import { handleGenerateAssessmentRequest } from "../backend/src/modules/interview/interview-api.js";

export default async function skillAssessment(request, response) {
  await handleGenerateAssessmentRequest(request, response);
}
