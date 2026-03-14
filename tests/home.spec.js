import { test, expect } from "@playwright/test";

const BASE_PATH = "/site-pizzaria";

test.describe("Home - Base Studio Pizzas", () => {
  test("deve carregar a página inicial com navbar e seções principais", async ({ page }) => {
    await page.goto(`${BASE_PATH}/`);

    await expect(page).toHaveURL(/site-pizzaria\/?$/);

    await expect(page.getByRole("banner")).toBeVisible();

    await expect(
      page.getByRole("link", { name: /base studio pizzas/i }).first()
    ).toBeVisible();

    await expect(page.getByRole("link", { name: "Início" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Destaques" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Como funciona" }).first()).toBeVisible();
    await expect(page.getByRole("link", { name: "Avaliações" }).first()).toBeVisible();

    await expect(page.getByRole("heading", { level: 1 }).first()).toBeVisible();

    await expect(page.locator("#destaques")).toBeVisible();
    await expect(page.locator("#como-funciona")).toBeVisible();
    await expect(page.locator("#depoimentos")).toBeVisible();

    await expect(page.locator("footer[aria-label='Rodapé']")).toBeVisible();
  });

  test("deve navegar para /menu pelo CTA da navbar", async ({ page }) => {
    await page.goto(`${BASE_PATH}/`);

    const navbar = page.getByRole("banner");
    const ctaNavbar = navbar.getByRole("link", { name: /fazer pedido/i }).first();

    await expect(ctaNavbar).toBeVisible();
    await ctaNavbar.click();

    await expect(page).toHaveURL(/site-pizzaria\/menu$/);
  });

  test("deve navegar para /menu pelo CTA final", async ({ page }) => {
    await page.goto(`${BASE_PATH}/`);

    const ctaFinal = page.getByRole("link", { name: /fazer pedido agora/i });

    await ctaFinal.scrollIntoViewIfNeeded();
    await expect(ctaFinal).toBeVisible();
    await ctaFinal.click();

    await expect(page).toHaveURL(/site-pizzaria\/menu$/);
  });

  test("deve exibir a seção Como funciona", async ({ page }) => {
    await page.goto(`${BASE_PATH}/`);

    const section = page.locator("#como-funciona");
    await section.scrollIntoViewIfNeeded();

    await expect(section).toBeVisible();
    await expect(
      page.getByRole("heading", { name: /como funciona/i })
    ).toBeVisible();
    await expect(page.getByText(/3 passos simples/i)).toBeVisible();
  });

  test("deve exibir a seção de avaliações", async ({ page }) => {
    await page.goto(`${BASE_PATH}/`);

    const section = page.locator("#depoimentos");
    await section.scrollIntoViewIfNeeded();

    await expect(section).toBeVisible();
  });

  test("deve exibir o footer com dados principais", async ({ page }) => {
    await page.goto(`${BASE_PATH}/`);

    const footer = page.locator("footer[aria-label='Rodapé']");
    await footer.scrollIntoViewIfNeeded();

    await expect(footer).toBeVisible();
    await expect(footer.locator("h4")).toContainText("Base Studio Pizzas");
    await expect(footer).toContainText("Brasília - DF");
    await expect(footer).toContainText("Desenvolvido por");
  });

  test("deve abrir links internos da navbar para seções da home", async ({ page }) => {
    await page.goto(`${BASE_PATH}/`);

    const navbar = page.getByRole("banner");

    await navbar.getByRole("link", { name: "Destaques" }).click();
    await expect.poll(() => page.url()).toContain("#destaques");

    await navbar.getByRole("link", { name: "Como funciona" }).click();
    await expect.poll(() => page.url()).toContain("#como-funciona");

    await navbar.getByRole("link", { name: "Avaliações" }).click();
    await expect.poll(() => page.url()).toContain("#depoimentos");
  });

  test("deve mostrar os controles do carousel", async ({ page }) => {
    await page.goto(`${BASE_PATH}/`);

    await expect(
      page.getByRole("button", { name: /anterior/i })
    ).toBeVisible();

    await expect(
      page.getByRole("button", { name: /próximo/i })
    ).toBeVisible();

    await expect(
      page.getByRole("tablist", { name: /selecionar slide/i })
    ).toBeVisible();
  });
});

test.describe("Home mobile", () => {
  test("deve abrir e fechar o menu mobile", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Este teste é somente para viewport mobile.");

    await page.goto(`${BASE_PATH}/`);

    const burger = page.getByRole("button", { name: /abrir menu/i });
    await expect(burger).toBeVisible();

    await burger.click();

    await expect(page.getByRole("link", { name: "Início" }).last()).toBeVisible();
    await expect(page.getByRole("link", { name: "Destaques" }).last()).toBeVisible();

    const closeBackdrop = page.getByRole("button", { name: /fechar menu/i }).last();
    await closeBackdrop.click();

    await expect(page.getByRole("button", { name: /abrir menu/i })).toBeVisible();
  });

  test("deve navegar para /menu pelo CTA mobile", async ({ page, isMobile }) => {
    test.skip(!isMobile, "Este teste é somente para viewport mobile.");

    await page.goto(`${BASE_PATH}/`);

    await page.getByRole("button", { name: /abrir menu/i }).click();

    await page.getByRole("link", { name: /fazer pedido/i }).last().click();

    await expect(page).toHaveURL(/site-pizzaria\/menu$/);
  });
});