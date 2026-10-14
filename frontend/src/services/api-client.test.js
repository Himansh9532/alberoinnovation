import assert from "node:assert/strict";
import test from "node:test";
import { apiRequest } from "./api-client.js";

test("apiRequest adds Firebase and JSON headers while preserving request options", async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl;
  let requestOptions;
  const body = JSON.stringify({ action: "analyze" });

  globalThis.fetch = async (url, options) => {
    requestUrl = url;
    requestOptions = options;
    return { ok: true, status: 200 };
  };

  try {
    const response = await apiRequest("/api/resume-assistant", {
      method: "POST",
      token: "firebase-token",
      body,
      headers: { "X-Request-Source": "resume-test" },
    });

    assert.deepEqual(response, { ok: true, status: 200 });
    assert.equal(requestUrl, "/api/resume-assistant");
    assert.equal(requestOptions.method, "POST");
    assert.equal(requestOptions.body, body);
    assert.equal(requestOptions.headers.get("Authorization"), "Bearer firebase-token");
    assert.equal(requestOptions.headers.get("Accept"), "application/json");
    assert.equal(requestOptions.headers.get("Content-Type"), "application/json");
    assert.equal(requestOptions.headers.get("X-Request-Source"), "resume-test");
  } finally {
    globalThis.fetch = originalFetch;
  }
});

test("apiRequest preserves query paths and does not add a body content type", async () => {
  const originalFetch = globalThis.fetch;
  let requestUrl;
  let requestHeaders;
  const endpoint = "/api/jobs/india?where=New+Delhi";

  globalThis.fetch = async (url, options) => {
    requestUrl = url;
    requestHeaders = options.headers;
    return { ok: true, status: 200 };
  };

  try {
    await apiRequest(endpoint, { token: "firebase-token" });

    assert.equal(requestUrl, endpoint);
    assert.equal(requestHeaders.get("Authorization"), "Bearer firebase-token");
    assert.equal(requestHeaders.get("Accept"), "application/json");
    assert.equal(requestHeaders.has("Content-Type"), false);
  } finally {
    globalThis.fetch = originalFetch;
  }
});