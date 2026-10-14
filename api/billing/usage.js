import { handleGetPlanUsage } from "../../backend/src/modules/billing/billing-api.js";

export default async function getPlanUsage(request, response) {
  await handleGetPlanUsage(request, response);
}
