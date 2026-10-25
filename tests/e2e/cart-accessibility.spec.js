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
