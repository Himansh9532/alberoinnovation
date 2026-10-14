import { apiRoutes } from "./routes.js";

export async function handler(event) {
  const path = event.rawPath || event.path || "/";
  if (path === "/health" && (event.requestContext?.http?.method || event.httpMethod) === "GET") {
    return {
      statusCode: 200,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ status: "ok" }),
    };
  }

  const routeHandler = apiRoutes.get(path);
  if (!routeHandler) {
    return {
      statusCode: 404,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ error: "API endpoint not found." }),
    };
  }

  const responseHeaders = {};
  const response = {
    statusCode: 200,
    setHeader(name, value) {
      responseHeaders[name] = value;
    },
    end(body) {
      this.body = body || "";
    },
  };
  const request = {
    method: event.requestContext?.http?.method || event.httpMethod,
    headers: event.headers || {},
    body: event.isBase64Encoded
      ? Buffer.from(event.body || "", "base64").toString("utf8")
      : event.body,
    url: `${path}${event.rawQueryString ? `?${event.rawQueryString}` : ""}`,
    query: event.queryStringParameters || {},
    socket: { remoteAddress: event.requestContext?.http?.sourceIp },
  };

  try {
    await routeHandler(request, response);
    return {
      statusCode: response.statusCode,
      headers: responseHeaders,
      body: response.body || "",
    };
  } catch (error) {
    console.error("Unhandled API request failure:", error);
    return {
      statusCode: 500,
      headers: { "Content-Type": "application/json; charset=utf-8" },
      body: JSON.stringify({ error: "The API request could not be completed." }),
    };
  }
}
