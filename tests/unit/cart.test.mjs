import test from "node:test";
import assert from "node:assert/strict";
import {
  MAX_CART_ITEMS,
  MAX_ITEM_QUANTITY,
  sanitizeCartItem,
  sanitizeCartItems,
} from "../../src/lib/cart.js";

const valid = { id: "item-1", productId: "pizza-1", name: "  Pizza calabresa  ", price: 32.5, quantity: 2 };

test("keeps valid items and normalizes names and prices", () => {
  assert.deepEqual(
    { name: sanitizeCartItem(valid).name, price: sanitizeCartItem(valid).price, quantity: sanitizeCartItem(valid).quantity },
    { name: "Pizza calabresa", price: 32.5, quantity: 2 },
  );
});

test("rejects non-finite, negative or extreme prices", () => {
  for (const price of [-1, "Infinity", Infinity, "NaN", undefined, 1e50]) {
    assert.equal(sanitizeCartItem({ ...valid, price }), null);
  }
});

test("rejects invalid quantities", () => {
  for (const quantity of [-1, 0, 1.2, "Infinity", NaN]) {
    assert.equal(sanitizeCartItem({ ...valid, quantity }), null);
  }
});

test("caps quantities and sanitizes notes and ingredients", () => {
  const item = sanitizeCartItem({
    ...valid,
    quantity: 1000000,
    notes: "a".repeat(1000),
    removedIngredients: [" Sem cebola ", null, "", " Sem azeitona "],
  });
  assert.equal(item.quantity, MAX_ITEM_QUANTITY);
  assert.equal(item.notes.length, 220);
  assert.deepEqual(item.removedIngredients, ["Sem cebola", "Sem azeitona"]);
});

test("rejects missing product references and invalid names", () => {
  assert.equal(sanitizeCartItem({ ...valid, id: null, productId: null }), null);
  assert.equal(sanitizeCartItem({ ...valid, name: "  " }), null);
});

test("limits the number of stored items", () => {
  const input = Array.from({ length: MAX_CART_ITEMS + 40 }, (_, i) => ({ ...valid, id: `item-${i}` }));
  assert.equal(sanitizeCartItems(input).length, MAX_CART_ITEMS);
  assert.deepEqual(sanitizeCartItems(null), []);
});

test("supports legacy carts with a productId but no item id", () => {
  const item = sanitizeCartItem({ productId: "old-product", name: "Pizza", price: 19.9 });
  assert.equal(item.id, "old-product");
  assert.equal(item.productId, "old-product");
});
