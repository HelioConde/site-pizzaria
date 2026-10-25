import test from "node:test";
import assert from "node:assert/strict";
import { calculateServerCheckout, verifyClientTotals, toCents } from "./checkoutPricing.mjs";

const pizza = {
  id: "11111111-1111-4111-8111-111111111111",
  name: "Pizza de Calabresa",
  price: 28.9,
  is_active: true,
};
const product = (overrides = {}) => ({ productId: pizza.id, price: 28.9, quantity: 2, ...overrides });

test("uses database prices, names and fee to calculate Stripe amounts", () => {
  const priced = calculateServerCheckout([product()], [pizza], 6.9);
  assert.deepEqual({
    name: priced.items[0].name,
    unitPriceCents: priced.items[0].unitPriceCents,
    subtotalCents: priced.subtotalCents,
    deliveryFeeCents: priced.deliveryFeeCents,
    totalCents: priced.totalCents,
  }, {
    name: "Pizza de Calabresa",
    unitPriceCents: 2890,
    subtotalCents: 5780,
    deliveryFeeCents: 690,
    totalCents: 6470,
  });
  assert.doesNotThrow(() => verifyClientTotals({
    subtotal: 57.8, deliveryFee: 6.9, total: 64.7,
  }, priced));
});

test("rejects forged or stale browser product prices", () => {
  assert.throws(() => calculateServerCheckout([product({ price: 0.01 })], [pizza], 6.9), /preço.*mudou/i);
});

test("rejects forged totals and delivery fees", () => {
  const priced = calculateServerCheckout([product()], [pizza], 6.9);
  assert.throws(() => verifyClientTotals({
    subtotal: 57.8, deliveryFee: 0, total: 57.8,
  }, priced), /valores.*mudaram/i);
});

test("rejects inactive/missing products", () => {
  assert.throws(() => calculateServerCheckout([product()], [{ ...pizza, is_active: false }], 6.9));
  assert.throws(() => calculateServerCheckout([product()], [], 6.9));
});

test("rejects malicious quantities and invalid currency", () => {
  for (const quantity of [0, -1, 2.5, 100, "Infinity"]) {
    assert.throws(() => calculateServerCheckout([product({ quantity })], [pizza], 6.9));
  }
  for (const value of ["NaN", "Infinity", -2, 1.001, null]) {
    assert.throws(() => toCents(value));
  }
});

test("rejects unlimited carts and invalid server fee", () => {
  const cart = Array.from({ length: 101 }, () => product());
  assert.throws(() => calculateServerCheckout(cart, [pizza], 6.9));
  assert.throws(() => calculateServerCheckout([product()], [pizza], -1));
});
