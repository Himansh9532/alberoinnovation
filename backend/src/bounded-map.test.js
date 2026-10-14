import assert from "node:assert/strict";
import test from "node:test";
import { setBoundedMapEntry } from "./middleware/bounded-map.js";

test("bounded map entries evict the oldest key when the configured capacity is reached", () => {
  const values = new Map([["first", 1], ["second", 2]]);

  setBoundedMapEntry(values, "third", 3, 2);

  assert.deepEqual([...values], [["second", 2], ["third", 3]]);
});

test("updating a bounded map entry does not evict another key", () => {
  const values = new Map([["first", 1], ["second", 2]]);

  setBoundedMapEntry(values, "first", 3, 2);

  assert.deepEqual([...values], [["first", 3], ["second", 2]]);
});
