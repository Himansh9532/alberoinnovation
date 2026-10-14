import { handleCreateRazorpayOrder } from "../../backend/src/modules/billing/billing-api.js";

export default async function createPlanOrder(request, response) {
  await handleCreateRazorpayOrder(request, response);
}
