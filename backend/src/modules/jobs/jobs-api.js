import { verifyFirebaseRequest } from "../billing/billing-api.js";
import { handleCors } from "../../middleware/cors.js";
import { setBoundedMapEntry } from "../../middleware/bounded-map.js";

const CACHE_TTL_MS = 10 * 60 * 1000;
const MAX_LOCATION_LENGTH = 100;
const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const RATE_LIMIT_REQUESTS = 10;
const responseCache = new Map();
const requestCounts = new Map();

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(payload));
}

function getLocation(request) {
  const queryLocation = request.query?.where;
  if (typeof queryLocation === "string") return queryLocation.trim();
  return new URL(request.url || "/", "http://localhost").searchParams.get("where")?.trim() || "";
}

function normalizeListingUrl(value) {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value);
    if (!/(^|\.)adzuna\.(?:in|co\.in|com)$/i.test(url.hostname)) return "";
    if (url.protocol !== "https:" && url.protocol !== "http:") return "";
    url.protocol = "https:";
    return url.href;
  } catch {
    return "";
  }
}

function normalizeAdzunaResults(results) {
  if (!Array.isArray(results)) throw new Error("Adzuna returned an unexpected job-search response.");
  return results.flatMap((job) => {
    const url = normalizeListingUrl(job.redirect_url);
    if (!url || !job.title) return [];
    const location = job.location?.display_name
      || (Array.isArray(job.location?.area) ? job.location.area.join(", ") : "")
      || "India";
    const description = String(job.description || "").replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
    const details = `${job.title} ${location} ${description}`;
    return [{
      id: `Adzuna:${job.id || url}`,
      title: String(job.title).trim(),
      company: String(job.company?.display_name || "Company not listed").trim(),
      location: String(location).trim(),
      url,
      source: "Adzuna",
      tags: [job.category?.label, job.contract_type, job.contract_time].filter(Boolean),
      description: description.slice(0, 5000),
      date: job.created || "",
      jobType: [job.contract_type, job.contract_time].filter(Boolean).join(", "),
      remote: /\b(remote|work from home|wfh)\b/i.test(details),
    }];
  });
}

function readCachedResults(key) {
  const cached = responseCache.get(key);
  if (!cached) return null;
  if (Date.now() - cached.fetchedAt >= CACHE_TTL_MS) {
    responseCache.delete(key);
    return null;
  }
  return cached;
}

function isRateLimited(uid) {
  const now = Date.now();
  const current = requestCounts.get(uid);
  if (!current || now - current.startedAt >= RATE_LIMIT_WINDOW_MS) {
    setBoundedMapEntry(requestCounts, uid, { startedAt: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT_REQUESTS;
}

export async function handleGetIndiaJobsRequest(request, response) {
  if (handleCors(request, response, ["GET", "OPTIONS"])) return;

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    sendJson(response, 405, { error: "Use GET to search India job listings." });
    return;
  }

  let user;
  try {
    user = await verifyFirebaseRequest(request);
  } catch (error) {
    sendJson(response, error.statusCode || 401, {
      error: error.message || "Sign in to search India job listings.",
      code: error.code || "AUTH_REQUIRED",
    });
    return;
  }

  if (isRateLimited(user.uid)) {
    sendJson(response, 429, { error: "Too many India job searches. Please wait a minute and try again." });
    return;
  }

  const where = getLocation(request);
  if (where.length > MAX_LOCATION_LENGTH || /[\r\n\0]/.test(where)) {
    sendJson(response, 400, { error: "Enter a location with 100 characters or fewer." });
    return;
  }

  const appId = process.env.ADZUNA_APP_ID;
  const appKey = process.env.ADZUNA_APP_KEY;
  if (!appId || !appKey) {
    sendJson(response, 503, {
      error: "Adzuna India search is not configured. Add ADZUNA_APP_ID and ADZUNA_APP_KEY to the server environment.",
      code: "ADZUNA_NOT_CONFIGURED",
    });
    return;
  }

  const cacheKey = where.toLowerCase();
  const cached = readCachedResults(cacheKey);
  if (cached) {
    sendJson(response, 200, { jobs: cached.jobs, fetchedAt: cached.fetchedAt, cached: true });
    return;
  }

  const endpoint = new URL("https://api.adzuna.com/v1/api/jobs/in/search/1");
  endpoint.search = new URLSearchParams({
    app_id: appId,
    app_key: appKey,
    results_per_page: "50",
    sort_by: "date",
    "content-type": "application/json",
    ...(where ? { where } : {}),
  }).toString();

  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 12_000);
    try {
      const upstream = await fetch(endpoint, {
        signal: controller.signal,
        headers: { Accept: "application/json" },
      });
      if (!upstream.ok) {
        console.error(`Adzuna India job request returned HTTP ${upstream.status}.`);
        sendJson(response, 502, { error: "Adzuna could not load India listings right now. Please try again later." });
        return;
      }

      const payload = await upstream.json();
      const jobs = normalizeAdzunaResults(payload.results);
      const fetchedAt = Date.now();
      responseCache.set(cacheKey, { jobs, fetchedAt });
      if (responseCache.size > 100) responseCache.delete(responseCache.keys().next().value);
      sendJson(response, 200, { jobs, fetchedAt, cached: false });
    } finally {
      clearTimeout(timeout);
    }
  } catch (error) {
    const timedOut = error.name === "AbortError";
    console.error(`Adzuna India job request failed: ${timedOut ? "upstream timeout" : "upstream error"}.`);
    sendJson(response, 502, {
      error: timedOut
        ? "Adzuna took too long to respond. Please try again."
        : "Adzuna could not load India listings right now. Please try again later.",
    });
  }
}
