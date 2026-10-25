import { SESv2Client, SendEmailCommand } from "@aws-sdk/client-sesv2";
import { FieldValue } from "firebase-admin/firestore";
import { getFirebaseAdmin } from "../../firebase-admin.js";
import { handleCors } from "../../middleware/cors.js";
import { setBoundedMapEntry } from "../../middleware/bounded-map.js";

const RATE_LIMIT_WINDOW_MS = 10 * 60 * 1000;
const RATE_LIMIT_REQUESTS = 5;
const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 5000;
const ALLOWED_TOPICS = new Set([
  "General enquiry",
  "Technical support",
  "Feedback or suggestion",
  "Partnership enquiry",
  "Billing question",
]);
const requestCounts = new Map();

function sendJson(response, statusCode, payload) {
  response.statusCode = statusCode;
  response.setHeader("Content-Type", "application/json; charset=utf-8");
  response.setHeader("Cache-Control", "no-store");
  response.end(JSON.stringify(payload));
}

function readRequestBody(body) {
  if (typeof body !== "string") return body && typeof body === "object" ? body : {};
  try {
    const parsed = JSON.parse(body);
    return parsed && typeof parsed === "object" ? parsed : {};
  } catch {
    return null;
  }
}

function getClientAddress(request) {
  return request.socket?.remoteAddress
    || request.requestContext?.http?.sourceIp
    || "unknown";
}

function isRateLimited(address) {
  const now = Date.now();
  const current = requestCounts.get(address);
  if (!current || now - current.startedAt >= RATE_LIMIT_WINDOW_MS) {
    setBoundedMapEntry(requestCounts, address, { startedAt: now, count: 1 });
    return false;
  }
  current.count += 1;
  return current.count > RATE_LIMIT_REQUESTS;
}

export function buildContactEmail({ name, email, topic, message, fromEmail, toEmail }) {
  return {
    FromEmailAddress: fromEmail,
    Destination: { ToAddresses: [toEmail] },
    ReplyToAddresses: [email],
    Content: {
      Simple: {
        Subject: { Data: `Website contact: ${topic}`, Charset: "UTF-8" },
        Body: {
          Text: {
            Data: `Name: ${name}\nEmail: ${email}\nTopic: ${topic}\n\n${message}`,
            Charset: "UTF-8",
          },
        },
      },
    },
  };
}

export async function saveContactSubmission(db, contact) {
  const submission = {
    ...contact,
    submittedAt: FieldValue.serverTimestamp(),
  };
  const saved = await db.collection("contactSubmissions").add(submission);
  return saved.id;
}

async function sendContactNotification(contact) {
  const region = process.env.AWS_REGION || process.env.AWS_DEFAULT_REGION;
  const fromEmail = process.env.SES_FROM_EMAIL;
  const toEmail = process.env.PAYMENT_RECEIPT_ADMIN_EMAIL;
  if (!region || !fromEmail || !toEmail) {
    console.error("Contact email notification was not sent because SES is not configured.");
    return false;
  }

  try {
    const emailRequest = buildContactEmail({ ...contact, fromEmail, toEmail });
    await new SESv2Client({ region }).send(new SendEmailCommand(emailRequest));
    return true;
  } catch (error) {
    console.error("Contact email notification failed:", error.message || "Unknown SES error");
    return false;
  }
}

export async function handleContactRequest(request, response, { getDatabase = () => getFirebaseAdmin().db } = {}) {
  if (handleCors(request, response, ["POST", "OPTIONS"])) return;

  if (request.method !== "POST") {
    response.setHeader("Allow", "POST");
    sendJson(response, 405, { error: "Use POST to send a contact message." });
    return;
  }

  const body = readRequestBody(request.body);
  if (!body) {
    sendJson(response, 400, { error: "The message could not be read. Please review the form and try again." });
    return;
  }

  const name = typeof body.name === "string" ? body.name.trim() : "";
  const email = typeof body.email === "string" ? body.email.trim() : "";
  const topic = typeof body.topic === "string" ? body.topic : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";

  if (
    !name
    || name.length > MAX_NAME_LENGTH
    || !email
    || email.length > MAX_EMAIL_LENGTH
    || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
    || !ALLOWED_TOPICS.has(topic)
    || !message
    || message.length > MAX_MESSAGE_LENGTH
  ) {
    sendJson(response, 400, {
      error: "Please provide a valid name, email, topic, and message (up to 5,000 characters).",
    });
    return;
  }

  if (isRateLimited(getClientAddress(request))) {
    sendJson(response, 429, { error: "Too many messages were sent from this connection. Please try again later." });
    return;
  }

  const contact = { name, email, topic, message };
  try {
    const db = getDatabase();
    await saveContactSubmission(db, contact);
  } catch (error) {
    console.error("Contact message could not be saved to Firestore:", error.message || "Unknown database error");
    sendJson(response, error.statusCode || 503, {
      error: "Your message could not be saved right now. Please try again later or email Business@alberotechnologies.com directly.",
    });
    return;
  }

  const emailSent = await sendContactNotification(contact);
  sendJson(response, 200, { savedToDatabase: true, emailSent });
}
