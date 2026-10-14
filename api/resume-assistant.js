import { handleResumeAssistantRequest } from "../backend/src/modules/resume/resume-assistant-api.js";

export default async function resumeAssistant(request, response) {
  await handleResumeAssistantRequest(request, response);
}
