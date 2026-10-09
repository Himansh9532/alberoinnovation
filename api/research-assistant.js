import { handleResearchAssistantRequest } from "../backend/server/research-assistant-api.js";

export default async function researchAssistant(request, response) {
  await handleResearchAssistantRequest(request, response);
}
