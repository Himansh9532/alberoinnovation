import { handleVerifyRazorpayPayment } from "../../backend/src/modules/billing/billing-api.js";

export default async function verifyPlanPayment(request, response) {
  await handleVerifyRazorpayPayment(request, response);
}
