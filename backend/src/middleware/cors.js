function getAllowedOrigins() {
  return (process.env.CORS_ALLOWED_ORIGINS || "")
    .split(",")
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export function handleCors(request, response, methods) {
  const origin = request.headers?.origin;
  if (!origin) return false;

  const requestHost = request.headers?.["x-forwarded-host"] || request.headers?.host;
  let sameOrigin = false;
  try {
    sameOrigin = Boolean(requestHost) && new URL(origin).host === requestHost;
  } catch {
    response.statusCode = 403;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.end(JSON.stringify({ error: "The request origin is invalid." }));
    return true;
  }

  const isAllowed = sameOrigin || getAllowedOrigins().includes(origin);
  if (!isAllowed) {
    response.statusCode = 403;
    response.setHeader("Content-Type", "application/json; charset=utf-8");
    response.end(JSON.stringify({ error: "This website is not allowed to access the API." }));
    return true;
  }

  response.setHeader("Access-Control-Allow-Origin", origin);
  response.setHeader("Access-Control-Allow-Methods", methods.join(", "));
  response.setHeader("Access-Control-Allow-Headers", "Authorization, Content-Type");
  response.setHeader("Vary", "Origin");

  if (request.method === "OPTIONS") {
    response.statusCode = 204;
    response.end("");
    return true;
  }

  return false;
}
