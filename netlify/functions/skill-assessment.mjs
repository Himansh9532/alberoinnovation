import { handleGenerateAssessmentRequest } from "../../backend/server/interview-api.js";

export async function handler(event) {
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

  await handleGenerateAssessmentRequest(request, response);
  return { statusCode: response.statusCode, headers, body };
}
