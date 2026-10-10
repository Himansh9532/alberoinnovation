import test from "node:test";
import assert from "node:assert/strict";
import { buildPaymentReceiptEmail } from "./billing-api.js";

test("payment receipt includes payment details and both recipients", () => {
  const email = buildPaymentReceiptEmail({
    customerEmail: "customer@example.com",
    adminEmail: "business@example.com",
    fromEmail: "receipts@example.com",
    order: { id: "order_123", plan: "pro", months: 3, amount: 159900, currency: "INR" },
    paymentId: "pay_123",
    paidAt: new Date("2025-01-15T10:00:00.000Z"),
    expiresAt: new Date("2025-04-15T10:00:00.000Z"),
  });

  assert.equal(email.FromEmailAddress, "receipts@example.com");
  assert.deepEqual(email.Destination, {
    ToAddresses: ["customer@example.com"],
    BccAddresses: ["business@example.com"],
  });
  const body = email.Content.Simple.Body.Text.Data;
  assert.match(body, /Pro · 3 months/);
  assert.match(body, /₹1,599\.00/);
  assert.match(body, /pay_123/);
  assert.match(body, /order_123/);
  assert.match(body, /15 January 2025/);
  assert.match(body, /15 April 2025/);
});

test("payment receipt rejects missing recipients and plan dates", () => {
  assert.throws(() => buildPaymentReceiptEmail({
    customerEmail: "",
    adminEmail: "business@example.com",
    fromEmail: "receipts@example.com",
    order: { id: "order_123", plan: "plus", months: 1, amount: 29900, currency: "INR" },
    paymentId: "pay_123",
    paidAt: new Date(),
    expiresAt: new Date(),
  }), /valid customer, admin, and SES sender email/);
});
