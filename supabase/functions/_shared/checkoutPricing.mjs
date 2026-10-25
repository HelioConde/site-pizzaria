// Shared pure pricing logic for Edge Functions. Never trust client totals.
export const MAX_CHECKOUT_ITEMS = 100;
export const MAX_CHECKOUT_QUANTITY = 99;

export function toCents(value) {
  if (value === null || value === undefined || value === "") throw new Error("Valor monetário ausente.");
  const numeric = Number(value);
  if (!Number.isFinite(numeric) || numeric < 0 || numeric > 1_000_000) {
    throw new Error("Valor monetário inválido.");
  }
  const cents = Math.round(numeric * 100);
  if (!Number.isSafeInteger(cents) || Math.abs(cents / 100 - numeric) > 0.000001) {
    throw new Error("Valor monetário deve ter até duas casas decimais.");
  }
  return cents;
}

export function calculateServerCheckout(cartItems, catalogProducts, configuredDeliveryFee) {
  if (!Array.isArray(cartItems) || cartItems.length < 1 || cartItems.length > MAX_CHECKOUT_ITEMS) {
    throw new Error("Quantidade de itens do carrinho inválida.");
  }
  if (!Array.isArray(catalogProducts)) throw new Error("Cardápio indisponível.");

  const products = new Map(catalogProducts.map((product) => [String(product.id), product]));
  let subtotalCents = 0;

  const items = cartItems.map((item) => {
    if (!item || typeof item !== "object" || Array.isArray(item)) {
      throw new Error("Item do carrinho inválido.");
    }
    const productId = String(item.productId || "");
    const product = products.get(productId);
    if (!product || product.is_active !== true) {
      throw new Error("Um produto do carrinho não está disponível.");
    }

    const quantity = Number(item.quantity);
    if (!Number.isSafeInteger(quantity) || quantity < 1 || quantity > MAX_CHECKOUT_QUANTITY) {
      throw new Error("Quantidade do produto inválida.");
    }

    const unitPriceCents = toCents(product.price);
    if (unitPriceCents < 1) throw new Error("Produto com preço inválido.");
    if (toCents(item.price) !== unitPriceCents) {
      throw new Error("O preço do cardápio mudou. Atualize a página para continuar.");
    }
    const lineTotal = unitPriceCents * quantity;
    subtotalCents += lineTotal;
    if (!Number.isSafeInteger(subtotalCents)) throw new Error("Total excedeu o limite.");

    return {
      productId,
      name: String(product.name || "Produto").slice(0, 160),
      quantity,
      unitPriceCents,
      notes: typeof item.notes === "string" ? item.notes.trim().slice(0, 220) : "",
      removedIngredients: Array.isArray(item.removedIngredients)
        ? item.removedIngredients.filter((value) => typeof value === "string").slice(0, 20)
          .map((value) => value.trim().slice(0, 100)).filter(Boolean)
        : [],
    };
  });

  const deliveryFeeCents = toCents(configuredDeliveryFee);
  const totalCents = subtotalCents + deliveryFeeCents;
  if (!Number.isSafeInteger(totalCents) || totalCents < 1) throw new Error("Total inválido.");

  return { items, subtotalCents, deliveryFeeCents, totalCents };
}

export function verifyClientTotals(body, canonical) {
  if (
    toCents(body?.subtotal) !== canonical.subtotalCents ||
    toCents(body?.deliveryFee) !== canonical.deliveryFeeCents ||
    toCents(body?.total) !== canonical.totalCents
  ) throw new Error("Os valores do pedido mudaram. Atualize o cardápio.");
}
