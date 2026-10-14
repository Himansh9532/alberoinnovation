import { handleResearchAssistantRequest } from "../backend/src/modules/research/research-assistant-api.js";

export default async function researchAssistant(request, response) {
  await handleResearchAssistantRequest(request, response);
}
