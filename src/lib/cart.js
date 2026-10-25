/**
 * Client-side cart normalization only.
 * IMPORTANT: the server must independently verify product prices, availability,
 * totals and authorization before creating a payable order.
 */
export const MAX_CART_ITEMS = 100;
export const MAX_ITEM_QUANTITY = 99;
export const MAX_ITEM_PRICE = 1_000_000;
export const MAX_NOTES_LENGTH = 220;

export function sanitizeCartItem(item) {
  if (!item || typeof item !== "object" || Array.isArray(item)) return null;
  const rawId = item.id ?? item.productId ?? item.baseProductId ?? item.originalProductId;
  const rawProductId = item.productId ?? item.baseProductId ?? item.originalProductId ?? null;
  const name = typeof item.name === "string" ? item.name.trim() : "";
  const price = Number(item.price);
  const quantity = Number(item.quantity ?? 1);

  if (
    rawId == null || String(rawId).trim() === "" ||
    !name ||
    !Number.isFinite(price) || price < 0 || price > MAX_ITEM_PRICE ||
    !Number.isSafeInteger(quantity) || quantity < 1
  ) return null;

  return {
    id: String(rawId),
    productId: rawProductId != null ? String(rawProductId) : null,
    name: name.slice(0, 160),
    price: Math.round((price + Number.EPSILON) * 100) / 100,
    image: typeof item.image === "string" ? item.image : null,
    quantity: Math.min(MAX_ITEM_QUANTITY, quantity),
    notes: String(item.notes ?? "").trim().slice(0, MAX_NOTES_LENGTH),
    removedIngredients: Array.isArray(item.removedIngredients)
      ? item.removedIngredients
        .filter((value) => typeof value === "string" && value.trim())
        .slice(0, 20)
        .map((value) => value.trim().slice(0, 100))
      : [],
  };
}

export function sanitizeCartItems(items) {
  if (!Array.isArray(items)) return [];
  return items.slice(0, MAX_CART_ITEMS).map(sanitizeCartItem).filter(Boolean);
}
