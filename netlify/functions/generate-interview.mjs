import { handleGenerateInterviewRequest } from "../../backend/server/interview-api.js";

export async function handler(event) {
  let statusCode = 200;
  const headers = {};
  let body = "";
  const request = {
    method: event.httpMethod,
    headers: event.headers,
    body: event.body,
  };
  const response = {
    setHeader(name, value) {
      headers[name] = value;
    },
    end(value) {
      body = value;
    },
  };

  await handleGenerateInterviewRequest(request, response);
  statusCode = response.statusCode;
  return { statusCode, headers, body };
}
