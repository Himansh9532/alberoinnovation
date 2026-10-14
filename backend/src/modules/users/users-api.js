import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../firebase-admin.js";
import { authenticateRequest } from "../billing/billing-api.js";
import { handleCors } from "../../middleware/cors.js";

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(payload));
}

export async function handleSaveUserProfile(request, response) {
  if (handleCors(request, response, ["POST", "OPTIONS"])) return;

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Use POST to save your user profile." });
    return;
  }

  try {
    const identity = await authenticateRequest(request);
    const { auth, db } = getFirebaseAdmin();
    const account = await auth.getUser(identity.uid);
    const userRef = db.collection("users").doc(identity.uid);
    await db.runTransaction(async (transaction) => {
      const existingUser = await transaction.get(userRef);
      const profile = {
        uid: identity.uid,
        email: account.email || identity.email || null,
        displayName: account.displayName || identity.name || null,
        providers: account.providerData.map(({ providerId }) => providerId),
        lastSignInProvider: identity.firebase?.sign_in_provider || null,
        loginCount: FieldValue.increment(1),
        lastLoginAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
      };

      if (!existingUser.exists) profile.createdAt = FieldValue.serverTimestamp();
      transaction.set(userRef, profile, { merge: true });
    });
    sendJson(response, 200, { saved: true });
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || "Your user profile could not be saved.",
      code: error.code || "USER_PROFILE_SAVE_FAILED",
    });
  }
}
