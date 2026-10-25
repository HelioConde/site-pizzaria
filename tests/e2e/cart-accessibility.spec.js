import { test, expect } from "@playwright/test";

test("cart dialog closes on Escape and restores keyboard focus", async ({ page }) => {
  await page.goto("./menu");
  const trigger = page.getByRole("button", { name: /Abrir carrinho/i });
  await expect(trigger).toBeVisible();
  await trigger.click();
  const dialog = page.getByRole("dialog", { name: "Carrinho de compras" });
  await expect(dialog).toBeVisible();
  await expect(page.getByRole("button", { name: "Fechar carrinho" })).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(dialog).toHaveCount(0);
  await expect(trigger).toBeFocused();
});

test("cart keyboard navigation is retained in dialog", async ({ page }) => {
  await page.goto("./menu");
  await page.getByRole("button", { name: /Abrir carrinho/i }).click();
  const dialog = page.getByRole("dialog", { name: "Carrinho de compras" });
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Tab");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByRole("button", { name: "Fechar carrinho" })).toBeFocused();
});


test("invalid stored cart values do not corrupt the cart summary", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("base-studio-pizzas-cart", JSON.stringify([
      { id: "valid-1", productId: "p1", name: "Pizza Teste", price: 30, quantity: 2 },
      { id: "bad-1", name: "Preço negativo", price: -100, quantity: 2 },
      { id: "bad-2", name: "Preço infinito", price: "Infinity", quantity: 2 },
      { id: "bad-3", name: "Quantidade inválida", price: 10, quantity: -3 },
    ]));
  });
  await page.goto("./menu");
  const cartButton = page.getByRole("button", { name: /Abrir carrinho com 2 item/i });
  await expect(cartButton).toBeVisible();
  await cartButton.click();
  const cart = page.getByRole("dialog", { name: "Carrinho de compras" });
  await expect(cart).toContainText("Pizza Teste");
  await expect(cart).not.toContainText("Preço negativo");
  await expect(cart).not.toContainText("Preço infinito");
  await expect(cart).toContainText("R$ 60,00");
});
