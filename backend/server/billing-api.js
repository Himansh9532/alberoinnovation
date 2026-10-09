import { createHmac, timingSafeEqual } from "node:crypto";
import { cert, getApps, initializeApp } from "firebase-admin/app";
import { getAuth } from "firebase-admin/auth";
import { FieldValue, getFirestore, Timestamp } from "firebase-admin/firestore";
import { handleCors } from "./cors.js";

const PLAN_LIMITS = {
  free: {
    interviews: 1,
    assessments: 1,
    interviewEvaluations: 1,
    assessmentEvaluations: 1,
    research: 0,
    maxAssessmentQuestions: 20,
  },
  plus: {
    interviews: 5,
    assessments: 5,
    interviewEvaluations: 5,
    assessmentEvaluations: 5,
    research: 10,
    maxAssessmentQuestions: 20,
  },
  pro: {
    interviews: 12,
    assessments: 12,
    interviewEvaluations: 12,
    assessmentEvaluations: 12,
    research: 30,
    maxAssessmentQuestions: 20,
  },
};
const PLAN_PRICES = { plus: 99900, pro: 199900 };
const PAID_PLAN_DURATION_MS = 30 * 24 * 60 * 60 * 1000;

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(payload));
}

function createHttpError(statusCode, message, code) {
  return Object.assign(new Error(message), { statusCode, code });
}

function readRequestBody(body) {
  if (typeof body !== "string") return body && typeof body === "object" ? body : {};
  try {
    const parsed = JSON.parse(body);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    throw createHttpError(400, "Request body must be valid JSON.", "INVALID_JSON");
  }
}

function getFirebaseAdmin() {
  const encodedCredential = process.env.FIREBASE_SERVICE_ACCOUNT_BASE64;
  const credentialJson = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
    || (encodedCredential ? Buffer.from(encodedCredential, "base64").toString("utf8") : "");
  if (!credentialJson) {
    throw createHttpError(503, "Plan and payment services are not configured. Add Firebase Admin credentials to the server environment.", "BILLING_NOT_CONFIGURED");
  }

  let serviceAccount;
  try {
    serviceAccount = JSON.parse(credentialJson);
  } catch {
    throw createHttpError(503, "Firebase Admin credentials are not valid JSON.", "BILLING_NOT_CONFIGURED");
  }
  if (typeof serviceAccount.private_key === "string") {
    serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, "\n");
  }

  const projectId = process.env.FIREBASE_PROJECT_ID || serviceAccount.project_id;
  if (!projectId || !serviceAccount.client_email || !serviceAccount.private_key) {
    throw createHttpError(503, "Firebase Admin credentials are incomplete.", "BILLING_NOT_CONFIGURED");
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

async function authenticateRequest(request) {
  const authorization = request.headers?.authorization || request.headers?.Authorization;
  const match = typeof authorization === "string" && authorization.match(/^Bearer\s+(.+)$/i);
  if (!match) throw createHttpError(401, "Sign in with your SkillAI account to use plans and AI practice.", "AUTH_REQUIRED");

  const { auth } = getFirebaseAdmin();
  try {
    return await auth.verifyIdToken(match[1], true);
  } catch {
    throw createHttpError(401, "Your sign-in has expired. Please sign in again.", "AUTH_INVALID");
  }
}

export async function verifyFirebaseRequest(request) {
  return authenticateRequest(request);
}

function getCurrentMonth() {
  return new Date().toISOString().slice(0, 7);
}

function toDate(value) {
  if (value?.toDate) return value.toDate();
  if (value instanceof Date) return value;
  return null;
}

function normalizePlanRecord(data = {}) {
  const activePlan = data.plan === "plus" || data.plan === "pro" ? data.plan : "free";
  const expiresAt = toDate(data.planExpiresAt);
  const plan = activePlan !== "free" && (!expiresAt || expiresAt.getTime() <= Date.now())
    ? "free"
    : activePlan;
  const month = getCurrentMonth();
  return {
    plan,
    planExpiresAt: plan === "free" ? null : expiresAt,
    freeUsed: data.freeUsed === true,
    usageMonth: month,
    interviewsUsed: data.usageMonth === month ? Math.max(0, Number(data.interviewsUsed) || 0) : 0,
    assessmentsUsed: data.usageMonth === month ? Math.max(0, Number(data.assessmentsUsed) || 0) : 0,
    interviewEvaluationsUsed: data.usageMonth === month ? Math.max(0, Number(data.interviewEvaluationsUsed) || 0) : 0,
    assessmentEvaluationsUsed: data.usageMonth === month ? Math.max(0, Number(data.assessmentEvaluationsUsed) || 0) : 0,
    researchUsed: data.usageMonth === month ? Math.max(0, Number(data.researchUsed) || 0) : 0,
    freeInterviewEvaluationUsed: data.freeInterviewEvaluationUsed === true,
    freeAssessmentEvaluationUsed: data.freeAssessmentEvaluationUsed === true,
  };
}

function formatUsage(record) {
  const limits = PLAN_LIMITS[record.plan];
  return {
    plan: record.plan,
    expiresAt: record.planExpiresAt?.toISOString() || null,
    freeUsed: record.freeUsed,
    month: record.usageMonth,
    usage: {
      interviews: { used: record.interviewsUsed, limit: limits.interviews },
      assessments: { used: record.assessmentsUsed, limit: limits.assessments },
      research: { used: record.researchUsed, limit: limits.research },
    },
  };
}

async function getOrInitializePlan(db, uid) {
  const userRef = db.collection("skillaiPlans").doc(uid);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef);
    const record = normalizePlanRecord(snapshot.exists ? snapshot.data() : {});
    transaction.set(userRef, {
      plan: record.plan,
      planExpiresAt: record.planExpiresAt ? Timestamp.fromDate(record.planExpiresAt) : null,
      freeUsed: record.freeUsed,
      usageMonth: record.usageMonth,
      interviewsUsed: record.interviewsUsed,
      assessmentsUsed: record.assessmentsUsed,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return record;
  });
}

export async function handleGetPlanUsage(request, response) {
  if (handleCors(request, response, ["GET", "OPTIONS"])) return;

  if (request.method !== "GET") {
    response.setHeader("Allow", "GET");
    sendJson(response, 405, { error: "Use GET to view your plan usage." });
    return;
  }

  try {
    const { uid } = await authenticateRequest(request);
    const { db } = getFirebaseAdmin();
    const record = await getOrInitializePlan(db, uid);
    sendJson(response, 200, formatUsage(record));
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || "Plan usage could not be loaded.",
      code: error.code || "PLAN_LOOKUP_FAILED",
    });
  }
}

export async function consumePlanUsage(request, feature, options = {}) {
  const usageFields = {
    interviews: "interviewsUsed",
    assessments: "assessmentsUsed",
    interviewEvaluations: "interviewEvaluationsUsed",
    assessmentEvaluations: "assessmentEvaluationsUsed",
    research: "researchUsed",
  };
  const usageField = usageFields[feature];
  if (!usageField) {
    throw createHttpError(400, "That practice feature is not supported.", "INVALID_FEATURE");
  }

  const { uid } = await authenticateRequest(request);
  const { db } = getFirebaseAdmin();
  const userRef = db.collection("skillaiPlans").doc(uid);
  return db.runTransaction(async (transaction) => {
    const snapshot = await transaction.get(userRef);
    const record = normalizePlanRecord(snapshot.exists ? snapshot.data() : {});
    const limits = PLAN_LIMITS[record.plan];
    if (
      record.plan === "free"
      && ((feature === "interviewEvaluations" && record.freeInterviewEvaluationUsed)
        || (feature === "assessmentEvaluations" && record.freeAssessmentEvaluationUsed))
    ) {
      throw createHttpError(402, "Your free AI feedback has already been used. Upgrade to Plus or Pro to continue.", "QUOTA_EXHAUSTED");
    }
    if (feature === "assessments" && Number(options.questionCount) > limits.maxAssessmentQuestions) {
      throw createHttpError(403, `Your ${record.plan} plan supports up to ${limits.maxAssessmentQuestions} questions per assessment.`, "ASSESSMENT_LENGTH_UNAVAILABLE");
    }
    if ((feature === "interviews" || feature === "assessments") && record.plan === "free" && record.freeUsed) {
      throw createHttpError(402, "Your free practice has been used. Upgrade to Plus or Pro to keep practicing.", "QUOTA_EXHAUSTED");
    }

    const used = record[usageField];
    const limit = limits[feature];
    if (used >= limit) {
      throw createHttpError(402, `You have used all ${limit} ${feature} this month. Upgrade your plan to continue.`, "QUOTA_EXHAUSTED");
    }

    const nextUsage = { [usageField]: used + 1 };
    const freeUsed = record.plan === "free" && (feature === "interviews" || feature === "assessments")
      ? true
      : record.freeUsed;
    const freeEvaluationUsage = record.plan !== "free"
      ? {}
      : feature === "interviewEvaluations"
        ? { freeInterviewEvaluationUsed: true }
        : feature === "assessmentEvaluations"
          ? { freeAssessmentEvaluationUsed: true }
          : {};
    transaction.set(userRef, {
      plan: record.plan,
      planExpiresAt: record.planExpiresAt ? Timestamp.fromDate(record.planExpiresAt) : null,
      freeUsed,
      usageMonth: record.usageMonth,
      interviewsUsed: record.interviewsUsed,
      assessmentsUsed: record.assessmentsUsed,
      interviewEvaluationsUsed: record.interviewEvaluationsUsed,
      assessmentEvaluationsUsed: record.assessmentEvaluationsUsed,
      researchUsed: record.researchUsed,
      freeInterviewEvaluationUsed: record.freeInterviewEvaluationUsed,
      freeAssessmentEvaluationUsed: record.freeAssessmentEvaluationUsed,
      ...nextUsage,
      ...freeEvaluationUsage,
      updatedAt: FieldValue.serverTimestamp(),
    }, { merge: true });
    return formatUsage({
      ...record,
      freeUsed,
      ...nextUsage,
    });
  });
}

export async function handleCreateRazorpayOrder(request, response) {
  if (handleCors(request, response, ["POST", "OPTIONS"])) return;

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Use POST to create a plan order." });
    return;
  }

  try {
    const { uid } = await authenticateRequest(request);
    const plan = readRequestBody(request.body).plan;
    if (plan !== "plus" && plan !== "pro") {
      throw createHttpError(400, "Choose a valid paid plan.", "INVALID_PLAN");
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw createHttpError(503, "Checkout is not configured yet. Add Razorpay server credentials to the deployment environment.", "PAYMENTS_NOT_CONFIGURED");
    }

    const { db } = getFirebaseAdmin();
    const amount = PLAN_PRICES[plan];
    const razorpayResponse = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount,
        currency: "INR",
        receipt: `skillai_${uid.slice(0, 12)}_${Date.now()}`,
        notes: { uid, plan },
      }),
      signal: AbortSignal.timeout(15000),
    });
    const order = await razorpayResponse.json();
    if (!razorpayResponse.ok || !order.id) {
      console.error("Razorpay order creation failed:", order.error?.description || razorpayResponse.status);
      throw createHttpError(502, "Razorpay could not create your order. Please try again.", "ORDER_CREATION_FAILED");
    }

    await db.collection("razorpayOrders").doc(order.id).create({
      uid,
      plan,
      amount,
      currency: "INR",
      status: "created",
      createdAt: FieldValue.serverTimestamp(),
    });
    sendJson(response, 200, {
      keyId,
      orderId: order.id,
      amount,
      currency: "INR",
      plan,
    });
  } catch (error) {
    sendJson(response, error.statusCode || 502, {
      error: error.message || "Checkout could not be started.",
      code: error.code || "ORDER_CREATION_FAILED",
    });
  }
}

export async function handleVerifyRazorpayPayment(request, response) {
  if (handleCors(request, response, ["POST", "OPTIONS"])) return;

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Use POST to verify a payment." });
    return;
  }

  try {
    const { uid } = await authenticateRequest(request);
    const { razorpay_order_id: orderId, razorpay_payment_id: paymentId, razorpay_signature: signature } = readRequestBody(request.body);
    if (
      typeof orderId !== "string" || !/^order_[A-Za-z0-9]+$/.test(orderId)
      || typeof paymentId !== "string" || !/^pay_[A-Za-z0-9]+$/.test(paymentId)
      || typeof signature !== "string" || !/^[a-f0-9]{64}$/i.test(signature)
    ) {
      throw createHttpError(400, "Razorpay payment details are incomplete.", "INVALID_PAYMENT");
    }

    const keyId = process.env.RAZORPAY_KEY_ID;
    const keySecret = process.env.RAZORPAY_KEY_SECRET;
    if (!keyId || !keySecret) {
      throw createHttpError(503, "Payment verification is not configured.", "PAYMENTS_NOT_CONFIGURED");
    }
    const expectedSignature = createHmac("sha256", keySecret).update(`${orderId}|${paymentId}`).digest();
    const receivedSignature = Buffer.from(signature, "hex");
    if (receivedSignature.length !== expectedSignature.length || !timingSafeEqual(expectedSignature, receivedSignature)) {
      throw createHttpError(400, "Razorpay payment signature is invalid.", "INVALID_SIGNATURE");
    }

    const { db } = getFirebaseAdmin();
    const orderRef = db.collection("razorpayOrders").doc(orderId);
    const orderSnapshot = await orderRef.get();
    const order = orderSnapshot.data();
    if (!orderSnapshot.exists || order.uid !== uid) {
      throw createHttpError(403, "This order does not belong to your account.", "ORDER_NOT_FOUND");
    }
    if (order.status === "paid" && order.paymentId === paymentId) {
      const planSnapshot = await db.collection("skillaiPlans").doc(uid).get();
      sendJson(response, 200, { success: true, plan: planSnapshot.data()?.plan || order.plan });
      return;
    }

    const paymentResponse = await fetch(`https://api.razorpay.com/v1/payments/${encodeURIComponent(paymentId)}`, {
      headers: { Authorization: `Basic ${Buffer.from(`${keyId}:${keySecret}`).toString("base64")}` },
      signal: AbortSignal.timeout(15000),
    });
    const payment = await paymentResponse.json();
    if (
      !paymentResponse.ok
      || payment.order_id !== orderId
      || payment.amount !== order.amount
      || payment.currency !== order.currency
      || payment.status !== "captured"
    ) {
      throw createHttpError(402, "The payment is not captured yet. If money was debited, wait a moment and retry verification.", "PAYMENT_NOT_CAPTURED");
    }

    const userRef = db.collection("skillaiPlans").doc(uid);
    await db.runTransaction(async (transaction) => {
      const [currentOrderSnapshot, userSnapshot, paymentSnapshot] = await Promise.all([
        transaction.get(orderRef),
        transaction.get(userRef),
        transaction.get(db.collection("razorpayPayments").doc(paymentId)),
      ]);
      const currentOrder = currentOrderSnapshot.data();
      if (!currentOrderSnapshot.exists || currentOrder.uid !== uid) {
        throw createHttpError(403, "This order does not belong to your account.", "ORDER_NOT_FOUND");
      }
      if (currentOrder.status === "paid" && currentOrder.paymentId === paymentId) return;
      if (paymentSnapshot.exists) {
        throw createHttpError(409, "This payment has already been applied to an account.", "PAYMENT_ALREADY_APPLIED");
      }

      const previousPlan = normalizePlanRecord(userSnapshot.exists ? userSnapshot.data() : {});
      const expiresBase = previousPlan.planExpiresAt && previousPlan.planExpiresAt.getTime() > Date.now()
        ? previousPlan.planExpiresAt.getTime()
        : Date.now();
      const expiresAt = new Date(expiresBase + PAID_PLAN_DURATION_MS);
      transaction.set(userRef, {
        plan: currentOrder.plan,
        planExpiresAt: Timestamp.fromDate(expiresAt),
        freeUsed: previousPlan.freeUsed,
        usageMonth: previousPlan.usageMonth,
        interviewsUsed: previousPlan.interviewsUsed,
        assessmentsUsed: previousPlan.assessmentsUsed,
        updatedAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      transaction.set(orderRef, {
        status: "paid",
        paymentId,
        paidAt: FieldValue.serverTimestamp(),
      }, { merge: true });
      transaction.create(db.collection("razorpayPayments").doc(paymentId), {
        uid,
        orderId,
        plan: currentOrder.plan,
        amount: currentOrder.amount,
        paidAt: FieldValue.serverTimestamp(),
      });
    });

    sendJson(response, 200, { success: true, plan: order.plan });
  } catch (error) {
    sendJson(response, error.statusCode || 502, {
      error: error.message || "Payment verification failed.",
      code: error.code || "PAYMENT_VERIFICATION_FAILED",
    });
  }
}

export async function handleConsumePlanUsage(request, response, feature) {
  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Use POST to begin a practice session." });
    return;
  }

  try {
    const usage = await consumePlanUsage(request, feature);
    sendJson(response, 200, usage);
  } catch (error) {
    sendJson(response, error.statusCode || 500, {
      error: error.message || "Your plan could not be verified.",
      code: error.code || "USAGE_CHECK_FAILED",
    });
  }
}
