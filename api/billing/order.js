import { handleCreateRazorpayOrder } from "../../backend/server/billing-api.js";

export default async function createPlanOrder(request, response) {
  await handleCreateRazorpayOrder(request, response);
}
