import assert from "node:assert/strict";
import test from "node:test";
import { SESv2Client } from "@aws-sdk/client-sesv2";
import { buildContactEmail, handleContactRequest, saveContactSubmission } from "./contact-api.js";

function createResponse() {
  return {
    statusCode: 200,
    headers: {},
    setHeader(name, value) {
      this.headers[name] = value;
    },
    end(body) {
      this.body = body;
    },
  };
}

function createRequest(body, address = "contact-form-test") {
  return {
    method: "POST",
    headers: {},
    socket: { remoteAddress: address },
    body: JSON.stringify(body),
  };
}

const validMessage = {
  name: "Alex Kumar",
  email: "alex@example.com",
  topic: "General enquiry",
  message: "I would like to learn more about Albero.",
};

test("contact email sends to the business address and replies to the sender", () => {
  const email = buildContactEmail({
    ...validMessage,
    fromEmail: "verified@example.com",
    toEmail: "business@example.com",
  });

  assert.equal(email.FromEmailAddress, "verified@example.com");
  assert.deepEqual(email.Destination, { ToAddresses: ["business@example.com"] });
  assert.deepEqual(email.ReplyToAddresses, ["alex@example.com"]);
  assert.equal(email.Content.Simple.Subject.Data, "Website contact: General enquiry");
  assert.match(email.Content.Simple.Body.Text.Data, /Alex Kumar/);
  assert.match(email.Content.Simple.Body.Text.Data, /I would like to learn more about Albero\./);
});

test("contact endpoint only accepts POST requests", async () => {
  const response = createResponse();
  await handleContactRequest({ method: "GET", headers: {} }, response);

  assert.equal(response.statusCode, 405);
  assert.equal(response.headers.Allow, "POST");
  assert.deepEqual(JSON.parse(response.body), { error: "Use POST to send a contact message." });
});

test("contact endpoint rejects invalid form data", async () => {
  const response = createResponse();
  await handleContactRequest(createRequest({ ...validMessage, email: "not-an-email" }), response);

  assert.equal(response.statusCode, 400);
  assert.match(JSON.parse(response.body).error, /valid name, email, topic, and message/);
});

test("contact submissions are saved to Firestore with a server timestamp", async () => {
  let collectionName;
  let savedRecord;
  const db = {
    collection(name) {
      collectionName = name;
      return {
        async add(record) {
          savedRecord = record;
          return { id: "submission-123" };
        },
      };
    },
  };

  const submissionId = await saveContactSubmission(db, validMessage);

  assert.equal(submissionId, "submission-123");
  assert.equal(collectionName, "contactSubmissions");
  assert.deepEqual(
    { name: savedRecord.name, email: savedRecord.email, topic: savedRecord.topic, message: savedRecord.message },
    validMessage,
  );
  assert.ok(savedRecord.submittedAt);
});

test("contact endpoint saves to Firestore and sends an SES notification", async (context) => {
  const originalRegion = process.env.AWS_REGION;
  const originalFromEmail = process.env.SES_FROM_EMAIL;
  const originalToEmail = process.env.PAYMENT_RECEIPT_ADMIN_EMAIL;
  process.env.AWS_REGION = "us-east-1";
  process.env.SES_FROM_EMAIL = "verified@example.com";
  process.env.PAYMENT_RECEIPT_ADMIN_EMAIL = "business@example.com";

  let command;
  let savedRecord;
  const db = {
    collection(name) {
      assert.equal(name, "contactSubmissions");
      return {
        async add(record) {
          savedRecord = record;
          return { id: "submission-123" };
        },
      };
    },
  };
  context.mock.method(SESv2Client.prototype, "send", async (request) => {
    command = request;
    return {};
  });

  try {
    const response = createResponse();
    await handleContactRequest(
      createRequest(validMessage, "contact-form-send-test"),
      response,
      { getDatabase: () => db },
    );

    assert.equal(response.statusCode, 200);
    assert.deepEqual(JSON.parse(response.body), { savedToDatabase: true, emailSent: true });
    assert.equal(savedRecord.name, validMessage.name);
    assert.equal(savedRecord.email, validMessage.email);
    assert.equal(savedRecord.topic, validMessage.topic);
    assert.equal(savedRecord.message, validMessage.message);
    assert.ok(savedRecord.submittedAt);
    assert.equal(command.input.FromEmailAddress, "verified@example.com");
    assert.deepEqual(command.input.Destination.ToAddresses, ["business@example.com"]);
    assert.deepEqual(command.input.ReplyToAddresses, ["alex@example.com"]);
  } finally {
    if (originalRegion === undefined) delete process.env.AWS_REGION;
    else process.env.AWS_REGION = originalRegion;
    if (originalFromEmail === undefined) delete process.env.SES_FROM_EMAIL;
    else process.env.SES_FROM_EMAIL = originalFromEmail;
    if (originalToEmail === undefined) delete process.env.PAYMENT_RECEIPT_ADMIN_EMAIL;
    else process.env.PAYMENT_RECEIPT_ADMIN_EMAIL = originalToEmail;
  }
});

test("contact endpoint reports database failures without claiming the submission was saved", async () => {
  const response = createResponse();
  await handleContactRequest(
    createRequest(validMessage, "contact-form-database-failure-test"),
    response,
    { getDatabase: () => { throw Object.assign(new Error("Firestore unavailable"), { statusCode: 503 }); } },
  );

  assert.equal(response.statusCode, 503);
  assert.match(JSON.parse(response.body).error, /could not be saved right now/);
});
