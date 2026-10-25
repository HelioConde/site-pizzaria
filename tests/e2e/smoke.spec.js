import { test, expect } from "@playwright/test";

test("homepage renders and exposes primary navigation", async ({ page }) => {
  await page.goto("./");
  await expect(page).toHaveTitle(/Base Studio Pizzas/);
  await expect(page.locator("h1").first()).toBeVisible();
  await expect(page.getByRole("link", { name: /Base Studio/i }).first()).toBeVisible();
});

test("unknown route provides a helpful fallback", async ({ page }) => {
  await page.goto("./pagina-que-nao-existe");
  await expect(page.getByRole("heading", { name: /Página não encontrada/i })).toBeVisible();
});

test("layout does not overflow viewport", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("h1").first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth + 2);
  expect(overflow).toBe(false);
});

test("capture home reference screenshot", async ({ page }) => {
  await page.goto("./");
  await expect(page.locator("h1").first()).toBeVisible();
  await page.screenshot({ path: `test-results/home-${test.info().project.name}.png`, fullPage: true });
});
