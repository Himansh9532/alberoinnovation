import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { getFirestore } from "firebase-admin/firestore";

export function getFirebaseAdmin() {
  const encodedCredential = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const credentialJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    || (encodedCredential ? Buffer.from(encodedCredential, "base64").toString("utf8") : "");
  if (!credentialJson) {
    throw Object.assign(new Error("Plan and payment services are not configured. Add Firebase Admin credentials to the server environment."), {
      statusCode: 503,
      code: "BILLING_NOT_CONFIGURED",
    });
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(credentialJson);
  } catch {
    throw Object.assign(new Error("Firebase Admin credentials are not valid JSON."), {
      statusCode: 503,
      code: "BILLING_NOT_CONFIGURED",
    });
  }
  if (typeof serviceAccount.private_key === "string") {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id;
  if (!projectId || !serviceAccount.client_email || !serviceAccount.private_key) {
    throw Object.assign(new Error("Firebase Admin credentials are incomplete."), {
      statusCode: 503,
      code: "BILLING_NOT_CONFIGURED",
    });
  }

  const app = getApps()[0] || initializeApp({
    credential: cert(serviceAccount),
    projectId,
  });
  return {
    auth: getAuth(app),
    db: getFirestore(app),
  };
}
