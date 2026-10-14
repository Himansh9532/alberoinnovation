import { timingSafeEqual } from "node:crypto";
import { AggregateField } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../firebase-admin.js";
import { handleCors } from "../../middleware/cors.js";
import { setBoundedMapEntry } from "../../middleware/bounded-map.js";
import { createAdminSession, verifyAdminPassword, verifyAdminSession } from "./admin-auth.js";

const attemptsByAddress = new Map();
const MAX_ATTEMPTS = 5;
const LOCKOUT_MS = 15 * 60 * 1000;
const MAX_LISTED_USERS = 100;

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(payload));
}

function readRequestBody(body) {
  if (typeof body === "object" && body) return body;
  if (typeof body !== "string") return {};
  try {
    const value = JSON.parse(body);
    return value && typeof value === "object" ? value : {};
  } catch {
    return {};
  }
}

function constantTimeStringEqual(first, second) {
  const firstBuffer = Buffer.from(first);
  const secondBuffer = Buffer.from(second);
  return firstBuffer.length === secondBuffer.length && timingSafeEqual(firstBuffer, secondBuffer);
}

function adminConfig() {
  const { ADMIN_USERNAME: username, ADMIN_PASSWORD_HASH: passwordHash, ADMIN_SESSION_SECRET: sessionSecret } = process.env;
  if (!username || !passwordHash || !sessionSecret || sessionSecret.length < 32) {
    throw Object.assign(new Error("Admin login is not configured. Set ADMIN_USERNAME, ADMIN_PASSWORD_HASH, and a 32-character ADMIN_SESSION_SECRET."), {
      statusCode: 503,
      code: "ADMIN_NOT_CONFIGURED",
    });
  }
  return { username, passwordHash, sessionSecret };
}

function getClientAddress(request) {
  return request.socket?.remoteAddress || "unknown";
}

function requireAdmin(request, secret) {
  const authorization = request.headers?.authorization || request.headers?.Authorization;
  const match = typeof authorization === "string" && authorization.match(/^Bearer\s+(.+)$/i);
  if (!match || !verifyAdminSession(match[1], secret)) {
    throw Object.assign(new Error("Admin session is missing or expired. Please sign in again."), {
      statusCode: 401,
      code: "ADMIN_AUTH_REQUIRED",
    });
  }
}

export async function handleAdminLogin(request, response) {
  if (handleCors(request, response, ["POST", "OPTIONS"])) return;
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Use POST to sign in as admin." });
    return;
  }

  try {
    const config = adminConfig();
    const address = getClientAddress(request);
    const now = Date.now();
    const attempts = attemptsByAddress.get(address);
    if (attempts && attempts.lockedUntil > now) {
      sendJson(response, 429, { error: "Too many admin sign-in attempts. Try again in 15 minutes.", code: "ADMIN_LOGIN_RATE_LIMITED" });
      return;
    }

    const { username, password } = readRequestBody(request.body);
    const priorAttempts = attempts
      && now - attempts.startedAt < LOCKOUT_MS
      && !(attempts.lockedUntil && attempts.lockedUntil <= now)
      ? attempts
      : undefined;
    const validUsername = typeof username === "string"
      && username.length <= 256
      && constantTimeStringEqual(username, config.username);
    const validPassword = typeof password === "string"
      && password.length >= 1
      && password.length <= 1024
      && await verifyAdminPassword(password, config.passwordHash);
    if (!validUsername || !validPassword) {
      const nextAttempts = (priorAttempts?.count || 0) + 1;
      setBoundedMapEntry(attemptsByAddress, address, {
        count: nextAttempts,
        startedAt: priorAttempts?.startedAt || now,
        lockedUntil: nextAttempts >= MAX_ATTEMPTS ? now + LOCKOUT_MS : 0,
      });
      sendJson(response, 401, { error: "Admin username or password is incorrect.", code: "ADMIN_CREDENTIALS_INVALID" });
      return;
    }

    attemptsByAddress.delete(address);
    sendJson(response, 200, createAdminSession(config.username, config.sessionSecret));
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || "Admin sign-in could not be completed.",
      code: error.code || "ADMIN_LOGIN_FAILED",
    });
  }
}

export async function handleAdminStats(request, response) {
  if (handleCors(request, response, ["GET", "OPTIONS"])) return;
  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    sendJson(response, 405, { error: "Use GET to view admin statistics." });
    return;
  }

  try {
    const { sessionSecret } = adminConfig();
    requireAdmin(request, sessionSecret);
    const { db } = getFirebaseAdmin();
    const users = db.collection("users");
    const [userCountSnapshot, loginTotalsSnapshot, resumeTotalsSnapshot, recentUsersSnapshot] = await Promise.all([
      users.count().get(),
      users.aggregate({ totalLogins: AggregateField.sum("loginCount") }).get(),
      users.aggregate({ totalResumeBytes: AggregateField.sum("resumeBytes") }).get(),
      users.orderBy("lastLoginAt", "desc").limit(MAX_LISTED_USERS).get(),
    ]);
    const totalLogins = loginTotalsSnapshot.data().totalLogins || 0;
    const totalResumeBytes = resumeTotalsSnapshot.data().totalResumeBytes || 0;
    sendJson(response, 200, {
      userCount: userCountSnapshot.data().count,
      totalLogins,
      totalResumeBytes,
      listedUserLimit: MAX_LISTED_USERS,
      users: recentUsersSnapshot.docs.map((snapshot) => {
        const user = snapshot.data();
        return {
          uid: snapshot.id,
          name: user.displayName || "Name not provided",
          email: user.email || "",
          loginCount: user.loginCount || 0,
          resumePresent: Boolean(user.resumePresent),
          resumeBytes: user.resumeBytes || 0,
          lastLoginAt: user.lastLoginAt?.toDate?.().toISOString() || null,
        };
      }),
    });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || "Admin statistics could not be loaded.",
      code: error.code || "ADMIN_STATS_FAILED",
    });
  }
}
