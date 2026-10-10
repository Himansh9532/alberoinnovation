import { handleResumeAssistantRequest } from "../backend/server/resume-assistant-api.js";

export default async function resumeAssistant(request, response) {
  await handleResumeAssistantRequest(request, response);
}
