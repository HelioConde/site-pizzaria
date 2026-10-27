import test from "node:test";
import assert from "node:assert/strict";
import { hasRealDiscount } from "../../src/lib/merchandising.js";

test("only a strictly lower current price is a discount", () => {
  assert.equal(hasRealDiscount(45, 34.9), true);
  assert.equal(hasRealDiscount("45.00", "34.90"), true);
  assert.equal(hasRealDiscount(25, 35), false);
  assert.equal(hasRealDiscount(30, 30), false);
});

test("unavailable and malformed values never generate sale labels", () => {
  for (const oldPrice of [null, undefined, "", "NaN", "Infinity", -5]) {
    assert.equal(hasRealDiscount(oldPrice, 25), false);
  }
  for (const price of [null, undefined, "", "NaN", "Infinity", -3]) {
    assert.equal(hasRealDiscount(40, price), false);
  }
});
