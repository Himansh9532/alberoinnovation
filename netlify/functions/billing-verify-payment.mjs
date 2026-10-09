import { handleVerifyRazorpayPayment } from "../../backend/server/billing-api.js";

export async function handler(event) {
  const headers = {};
  let body = "";
  const response = {
    setHeader(name, value) {
      headers[name] = value;
    },
    end(value) {
      body = value;
    },
  };
  await handleVerifyRazorpayPayment({ method: event.httpMethod, headers: event.headers, body: event.body }, response);
  return { statusCode: response.statusCode, headers, body };
}
