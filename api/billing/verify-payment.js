import { handleVerifyRazorpayPayment } from "../../backend/server/billing-api.js";

export default async function verifyPlanPayment(request, response) {
  await handleVerifyRazorpayPayment(request, response);
}
