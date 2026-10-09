import { createServer } from "node:http";
import { handleCreateRazorpayOrder, handleGetPlanUsage, handleVerifyRazorpayPayment } from "./billing-api.js";
import { handleGetIndiaJobsRequest } from "./jobs-api.js";
import { handleGenerateAssessmentRequest, handleGenerateInterviewRequest } from "./interview-api.js";
import { handleResearchAssistantRequest } from "./research-assistant-api.js";

const routes = new Map([
  ["/api/generate-interview", handleGenerateInterviewRequest],
  ["/api/skill-assessment", handleGenerateAssessmentRequest],
  ["/api/research-assistant", handleResearchAssistantRequest],
  ["/api/billing/usage", handleGetPlanUsage],
  ["/api/billing/order", handleCreateRazorpayOrder],
  ["/api/billing/verify-payment", handleVerifyRazorpayPayment],
  ["/api/jobs/india", handleGetIndiaJobsRequest],
]);

const server = createServer(async (incoming, outgoing) => {
  const { pathname } = new URL(incoming.url || "/", "http://localhost");
  if (pathname === "/health" && incoming.method === "GET") {
    outgoing.writeHead(200, { "Content-Type": "application/json; charset=utf-8" });
    outgoing.end(JSON.stringify({ status: "ok" }));
    return;
  }

  const handler = routes.get(pathname);
  if (!handler) {
    outgoing.writeHead(404, { "Content-Type": "application/json; charset=utf-8" });
    outgoing.end(JSON.stringify({ error: "API endpoint not found." }));
    return;
  }

  const chunks = [];
  let size = 0;
  for await (const chunk of incoming) {
    size += chunk.length;
    if (size > 256 * 1024) {
      outgoing.writeHead(413, { "Content-Type": "application/json; charset=utf-8" });
      outgoing.end(JSON.stringify({ error: "Request is too large." }));
      return;
    }
    chunks.push(chunk);
  }

  const request = {
    method: incoming.method,
    url: incoming.url,
    headers: incoming.headers,
    socket: incoming.socket,
    body: chunks.length ? Buffer.concat(chunks).toString("utf8") : undefined,
  };
  const response = {
    statusCode: 200,
    setHeader(name, value) {
      outgoing.setHeader(name, value);
    },
    end(body) {
      outgoing.statusCode = this.statusCode;
      outgoing.end(body);
    },
  };

  try {
    await handler(request, response);
    if (!outgoing.writableEnded) outgoing.end();
  } catch (error) {
    console.error("Unhandled API request failure:", error);
    if (!outgoing.headersSent) {
      outgoing.writeHead(500, { "Content-Type": "application/json; charset=utf-8" });
    }
    if (!outgoing.writableEnded) outgoing.end(JSON.stringify({ error: "The API request could not be completed." }));
  }
});

const port = Number(process.env.PORT || 3001);
server.listen(port, "0.0.0.0", () => {
  console.log(`API server listening on port ${port}`);
});
