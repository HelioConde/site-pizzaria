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

test("carousel next control changes visible slide", async ({ page }) => {
  await page.goto("./");
  const selected = page.getByRole("button", { name: "Ir para o slide 1" });
  await expect(selected).toHaveAttribute("aria-current", "true");
  await page.getByRole("button", { name: "Próximo slide" }).click();
  await expect(page.getByRole("button", { name: "Ir para o slide 2" })).toHaveAttribute("aria-current", "true");
});

test("catalog search area renders without horizontal overflow", async ({ page }) => {
  await page.goto("./menu");
  await expect(page.locator("body")).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > innerWidth + 2);
  expect(overflow).toBe(false);
});

test("Como funciona renders actual steps and navigation reaches it", async ({ page }) => {
  await page.goto("./");
  const heading = page.getByRole("heading", { name: "Do cardápio até a entrega" });
  await expect(heading).toBeVisible();
  await expect(page.getByRole("heading", { name: "Escolha seu sabor" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Personalize o pedido" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Acompanhe as etapas" })).toBeVisible();
  const mobileMenu = page.getByRole("button", { name: "Abrir menu" });
  if (await mobileMenu.isVisible()) await mobileMenu.click();
  await page.getByRole("link", { name: "Como funciona", exact: true }).click();
  await expect(page).toHaveURL(/#como-funciona$/);
});

test("carousel has an explicit pause and resume control", async ({ page }) => {
  await page.goto("./");
  const pause = page.getByRole("button", { name: "Pausar reprodução automática" });
  await expect(pause).toBeVisible();
  await pause.click();
  await expect(page.getByRole("button", { name: "Retomar reprodução automática" }))
    .toHaveAttribute("aria-pressed", "true");
  await page.getByRole("button", { name: "Retomar reprodução automática" }).click();
  await expect(pause).toHaveAttribute("aria-pressed", "false");
});

test("reduced motion disables automatic carousel until explicit opt in", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  const resume = page.getByRole("button", { name: "Retomar reprodução automática" });
  await expect(resume).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("button", { name: "Ir para o slide 1" }))
    .toHaveAttribute("aria-current", "true");
});
