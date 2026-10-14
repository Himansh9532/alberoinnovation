import assert from "node:assert/strict";
import test from "node:test";
import { handleGenerateAssessmentRequest, handleGenerateInterviewRequest } from "./interview-api.js";

const MAX_BODY_BYTES = 256 * 1024;

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(body) {
      this.body = body;
    },
  };
}

test("interview and assessment handlers reject oversized adapter request bodies", async () => {
  for (const [index, handler] of [handleGenerateInterviewRequest, handleGenerateAssessmentRequest].entries()) {
    const response = createResponse();
    await handler({
      method: "POST",
      headers: {},
      body: JSON.stringify({ resumeText: "a".repeat(MAX_BODY_BYTES) }),
      socket: { remoteAddress: `test-client-${index}` },
    }, response);

    assert.equal(response.statusCode, 413);
    assert.deepEqual(JSON.parse(response.body), { error: "Request is too large." });
  }
});

test("interview and assessment handlers reject request bodies larger than the byte limit", async () => {
  for (const [index, handler] of [handleGenerateInterviewRequest, handleGenerateAssessmentRequest].entries()) {
    const response = createResponse();
    await handler({
      method: "POST",
      headers: {},
      body: " ".repeat(MAX_BODY_BYTES + 1),
      socket: { remoteAddress: `oversized-client-${index}` },
    }, response);

    assert.equal(response.statusCode, 413);
    assert.deepEqual(JSON.parse(response.body), { error: "Request is too large." });
  }
});

test("interview rate limits use the adapter's source address instead of a forwarded client header", async () => {
  const clientAddress = `rate-limit-test-${Date.now()}`;
  const handler = handleGenerateInterviewRequest;
  let lastResponse;

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const response = createResponse();
    await handler({
      method: "POST",
      headers: { "x-forwarded-for": `spoofed-address-${attempt}` },
      body: "{}",
      socket: { remoteAddress: clientAddress },
    }, response);
    lastResponse = response;
    if (attempt < 8) assert.equal(response.statusCode, 400);
  }

  assert.equal(lastResponse.statusCode, 429);
  assert.match(JSON.parse(lastResponse.body).error, /Too many interview requests/);
});
