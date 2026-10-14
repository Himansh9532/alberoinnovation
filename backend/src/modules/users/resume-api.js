import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../firebase-admin.js";
import { authenticateRequest } from "../billing/billing-api.js";
import { handleCors } from "../../middleware/cors.js";

const MAX_RESUME_BYTES = 100 * 1024;

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
    const error = new Error("Request body must be valid JSON.");
    error.statusCode = 400;
    error.code = "INVALID_JSON";
    throw error;
  }
}

export async function handleUserResume(request, response) {
  if (handleCors(request, response, ["GET", "PUT", "DELETE", "OPTIONS"])) return;
  if (!["GET", "PUT", "DELETE"].includes(request.method)) {
    response.setHeader("Allow", "GET, PUT, DELETE");
    sendJson(response, 405, { error: "Use GET, PUT, or DELETE to manage your resume." });
    return;
  }

  try {
    const { uid } = await authenticateRequest(request);
    const { db } = getFirebaseAdmin();
    const userRef = db.collection("users").doc(uid);
    const resumeRef = userRef.collection("resumes").doc("current");

    if (request.method === "GET") {
      const snapshot = await resumeRef.get();
      sendJson(response, 200, { resumeText: snapshot.exists ? snapshot.get("text") : "" });
      return;
    }

    if (request.method === "DELETE") {
      await db.runTransaction(async (transaction) => {
        transaction.delete(resumeRef);
        transaction.set(userRef, {
          resumeBytes: 0,
          resumePresent: false,
          resumeUpdatedAt: FieldValue.serverTimestamp(),
          updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
      });
      sendJson(response, 200, { saved: true, resumeBytes: 0 });
      return;
    }

    const { resumeText } = readRequestBody(request.body);
    if (typeof resumeText !== "string") {
      sendJson(response, 400, { error: "Resume text must be a string.", code: "INVALID_RESUME" });
      return;
    }
    const resumeBytes = Buffer.byteLength(resumeText, "utf8");
    if (resumeBytes > MAX_RESUME_BYTES) {
      sendJson(response, 413, { error: "Resume text must be 100 KB or smaller.", code: "RESUME_TOO_LARGE" });
      return;
    }

    await db.runTransaction(async (transaction) => {
      if (resumeText) {
        transaction.set(resumeRef, {
          text: resumeText,
          updatedAt: FieldValue.serverTimestamp(),
        });
      } else {
        transaction.delete(resumeRef);
      }
      transaction.set(userRef, {
        resumeBytes,
        resumePresent: Boolean(resumeText),
        resumeUpdatedAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
    });
    sendJson(response, 200, { saved: true, resumeBytes });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || "Your resume could not be saved.",
      code: error.code || "RESUME_SAVE_FAILED",
    });
  }
}
