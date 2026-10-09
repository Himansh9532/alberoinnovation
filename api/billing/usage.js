import { handleGetPlanUsage } from "../../backend/server/billing-api.js";

export default async function getPlanUsage(request, response) {
  await handleGetPlanUsage(request, response);
}
