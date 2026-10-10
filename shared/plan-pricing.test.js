import assert from "node:assert/strict";
import test from "node:test";
import { addCalendarMonths, getPlanPricePaise } from "./plan-pricing.js";

test("paid plans expose the approved prices for all billing terms", () => {
  assert.deepEqual(
    [1, 3, 6, 12].map((months) => getPlanPricePaise("plus", months)),
    [29900, 79900, 149900, 269900],
  );
  assert.deepEqual(
    [1, 3, 6, 12].map((months) => getPlanPricePaise("pro", months)),
    [59900, 159900, 299900, 539900],
  );
});

test("invalid plans and billing terms have no payable amount", () => {
  assert.equal(getPlanPricePaise("free", 1), null);
  assert.equal(getPlanPricePaise("plus", 2), null);
});

test("plan expiry adds calendar months and clamps month-end dates", () => {
  assert.equal(
    addCalendarMonths(new Date("2026-01-31T12:00:00.000Z"), 1).toISOString(),
    "2026-02-28T12:00:00.000Z",
  );
  assert.equal(
    addCalendarMonths(new Date("2024-02-29T00:00:00.000Z"), 12).toISOString(),
    "2025-02-28T00:00:00.000Z",
  );
});
