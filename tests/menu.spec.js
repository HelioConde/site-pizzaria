import { test, expect } from "@playwright/test";

const BASE_PATH = "/site-pizzaria";

test.describe("Menu - Base Studio Pizzas", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`${BASE_PATH}/menu`);
    });

    test("deve carregar a página do cardápio", async ({ page }) => {
        await expect(page).toHaveURL(/site-pizzaria\/menu$/);

        await expect(
            page.getByText("Cardápio digital", { exact: true })
        ).toBeVisible();

        await expect(
            page.getByRole("heading", { name: /nosso cardápio/i })
        ).toBeVisible();

        await expect(
            page.getByPlaceholder(/buscar pizza ou ingrediente/i)
        ).toBeVisible();
    });

    test("deve exibir produtos no catálogo", async ({ page }) => {
        await expect(page.locator("article").first()).toBeVisible();
        await expect(page.getByRole("button", { name: "Adicionar" }).first()).toBeVisible();
    });

    test("deve abrir o modal ao clicar em adicionar", async ({ page }) => {
        await page.getByRole("button", { name: "Adicionar" }).first().click();

        await expect(
            page.locator('[aria-label="Personalizar produto"]')
        ).toBeVisible();

        await expect(
            page.getByRole("button", { name: /adicionar ao carrinho/i })
        ).toBeVisible();

        await expect(
            page.getByRole("button", { name: /cancelar/i })
        ).toBeVisible();
    });

    test("deve fechar o modal de produto ao clicar em cancelar", async ({ page }) => {
        await page.getByRole("button", { name: "Adicionar" }).first().click();

        const modal = page.locator('[aria-label="Personalizar produto"]');
        await expect(modal).toBeVisible();

        await page.getByRole("button", { name: /cancelar/i }).click();

        await expect(modal).not.toBeVisible();
    });

    test("deve adicionar item ao carrinho", async ({ page }) => {
        await page.getByRole("button", { name: "Adicionar" }).first().click();
        await page.getByRole("button", { name: /adicionar ao carrinho/i }).click();

        const floatingCart = page.locator('[aria-label^="Abrir carrinho com"]');

        await expect(floatingCart).toBeVisible();
        await expect(floatingCart).toContainText("1 item");
    });

    test("deve abrir o drawer do carrinho", async ({ page }) => {

        await page.getByRole("button", { name: "Adicionar" }).first().click();
        await page.getByRole("button", { name: /adicionar ao carrinho/i }).click();

        const cartButton = page.locator("button").filter({
            hasText: "Ver carrinho"
        });

        await cartButton.click();

        const drawer = page.locator('[aria-label="Carrinho de compras"]');

        await expect(drawer).toBeVisible();

        await expect(
            page.getByRole("heading", { name: /seu carrinho/i })
        ).toBeVisible();

    });

    test("deve navegar para checkout pelo carrinho", async ({ page }) => {
        await page.getByRole("button", { name: "Adicionar" }).first().click();
        await page.getByRole("button", { name: /adicionar ao carrinho/i }).click();

        await page.locator('[aria-label^="Abrir carrinho com"]').click();

        await page.getByRole("link", { name: /finalizar pedido/i }).click();

        await expect(page).toHaveURL(/site-pizzaria\/checkout$/);
    });
});