import { handleGetPlanUsage } from "../../backend/server/billing-api.js";

export async function handler(event) {
  let statusCode = 200;
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
  await handleGetPlanUsage({ method: event.httpMethod, headers: event.headers, body: event.body }, response);
  statusCode = response.statusCode;
  return { statusCode, headers, body };
}
