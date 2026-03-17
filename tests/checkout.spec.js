import { test, expect } from "@playwright/test";

const BASE_PATH = "/site-pizzaria";

async function goToCheckoutWithCart(page) {
    await page.goto(`${BASE_PATH}/menu`);

    const productCard = page.getByRole("article").filter({
        hasText: /Pizza Calabresa/i,
    }).first();

    await expect(productCard).toBeVisible();

    await productCard.getByRole("button", { name: /^Adicionar$/i }).click();

    const addToCartButton = page.getByRole("button", {
        name: /adicionar ao carrinho/i,
    });

    await expect(addToCartButton).toBeVisible();
    await addToCartButton.click();

    const cartTrigger = page.getByRole("button", {
        name: /abrir carrinho/i,
    });

    await expect(cartTrigger).toBeVisible();
    await cartTrigger.click();

    const drawer = page.getByRole("complementary", {
        name: /carrinho de compras/i,
    });

    const checkoutLink = drawer.getByRole("link", {
        name: /finalizar pedido/i,
    });

    await expect(checkoutLink).toBeVisible();
    await checkoutLink.click();

    await expect(page).toHaveURL(/\/checkout$/);
}

test.describe("Checkout - Base Studio Pizzas", () => {
    test.beforeEach(async ({ page }) => {
        await goToCheckoutWithCart(page);
    });

    test("deve carregar a página de checkout", async ({ page }) => {
        await expect(
            page.getByRole("heading", { name: /finalizar pedido/i })
        ).toBeVisible();
    });

    test("deve exibir resumo do pedido", async ({ page }) => {
        await expect(page.getByText(/resumo do pedido/i)).toBeVisible();
        await expect(page.getByText(/pizza calabresa/i)).toBeVisible();
        await expect(page.getByText(/subtotal/i)).toBeVisible();
        await expect(page.getByText(/total/i)).toBeVisible();
    });

    test("botão voltar ao cardápio deve funcionar", async ({ page }) => {
        const backButton = page.getByRole("link", {
            name: /voltar ao cardápio/i,
        });

        await expect(backButton).toBeVisible();
        await backButton.click();

        await expect(page).toHaveURL(/\/menu$/);
    });
});