import { test, expect } from "@playwright/test";

const BASE_PATH = "/site-pizzaria";

async function closeCartIfOpen(page) {
    const drawer = page.getByRole("complementary", {
        name: /carrinho de compras/i,
    });

    const closeButton = drawer.getByRole("button", {
        name: /fechar carrinho/i,
    });

    if (await closeButton.isVisible().catch(() => false)) {
        await closeButton.click();
        await expect(drawer).toBeHidden();
    }
}

async function addPizzaCalabresaToCart(page) {
    await closeCartIfOpen(page);

    const productCard = page.getByRole("article").filter({
        hasText: /Pizza Calabresa/i,
    }).first();

    await expect(productCard).toBeVisible();

    const addButton = productCard.getByRole("button", { name: /^Adicionar$/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    const modalAddButton = page.getByRole("button", { name: /adicionar ao carrinho/i });
    await expect(modalAddButton).toBeVisible();
    await modalAddButton.click();

    const cartTrigger = page.getByRole("button", {
        name: /abrir carrinho/i,
    });

    await expect(cartTrigger).toBeVisible();
    await expect(cartTrigger).toContainText(/1 item/i);
}

async function addPizzaFrangoToCart(page) {
    await closeCartIfOpen(page);

    const productCard = page.getByRole("article").filter({
        hasText: /Pizza Frango com Catupiry/i,
    }).first();

    await expect(productCard).toBeVisible();

    const addButton = productCard.getByRole("button", { name: /^Adicionar$/i });
    await expect(addButton).toBeVisible();
    await addButton.click();

    const modalAddButton = page.getByRole("button", { name: /adicionar ao carrinho/i });
    await expect(modalAddButton).toBeVisible();
    await modalAddButton.click();
}

async function addCustomizedPizzaCalabresaToCart(page) {
    await closeCartIfOpen(page);

    const productCard = page.getByRole("article").filter({
        hasText: /Pizza Calabresa/i,
    }).first();

    await expect(productCard).toBeVisible();
    await productCard.getByRole("button", { name: /^Adicionar$/i }).click();

    await expect(page.getByText(/remover ingredientes/i)).toBeVisible();

    const semCebola = page.getByRole("checkbox", { name: /sem cebola/i });
    const semTomate = page.getByRole("checkbox", { name: /sem tomate/i });

    await expect(semCebola).toBeVisible();
    await expect(semTomate).toBeVisible();

    await semCebola.check();
    await semTomate.check();

    const observationField = page.getByPlaceholder(/massa bem assada/i);
    await expect(observationField).toBeVisible();
    await observationField.fill("Sem muito molho");

    await page.getByRole("button", { name: /adicionar ao carrinho/i }).click();

    const cartTrigger = page.getByRole("button", {
        name: /abrir carrinho/i,
    });

    await expect(cartTrigger).toBeVisible();
    await expect(cartTrigger).toContainText(/1 item/i);
}

async function openCart(page) {
    const drawer = page.getByRole("complementary", {
        name: /carrinho de compras/i,
    });

    const cartTrigger = page.getByRole("button", {
        name: /abrir carrinho/i,
    });

    await expect(cartTrigger).toBeVisible();

    if (!(await drawer.isVisible().catch(() => false))) {
        await cartTrigger.click();
    }

    await expect(drawer).toBeVisible();
    return drawer;
}

test.describe("Carrinho - Base Studio Pizzas", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto(`${BASE_PATH}/menu`);
    });

    test("menu deve carregar produtos", async ({ page }) => {
        await expect(page.getByRole("heading", { name: /nosso cardápio/i })).toBeVisible();
        await expect(page.getByRole("button", { name: /^Adicionar$/i }).first()).toBeVisible();
    });

    test("deve abrir modal do produto", async ({ page }) => {
        const calabresaCard = page.getByRole("article").filter({
            hasText: /Pizza Calabresa/i,
        }).first();

        await expect(calabresaCard).toBeVisible();
        await calabresaCard.getByRole("button", { name: /^Adicionar$/i }).click();

        await expect(page.getByText(/remover ingredientes/i)).toBeVisible();
        await expect(page.getByRole("button", { name: /adicionar ao carrinho/i })).toBeVisible();
    });

    test("deve adicionar produto ao carrinho pelo modal", async ({ page }) => {
        await addPizzaCalabresaToCart(page);

        const cartTrigger = page.getByRole("button", {
            name: /abrir carrinho/i,
        });

        await expect(cartTrigger).toBeVisible();
        await expect(cartTrigger).toContainText(/1 item/i);
    });

    test("deve abrir carrinho lateral", async ({ page }) => {
        await addPizzaCalabresaToCart(page);

        const drawer = await openCart(page);
        await expect(drawer).toContainText(/pizza calabresa/i);
    });

    test("deve mostrar estado vazio ao abrir carrinho sem itens", async ({ page }) => {
        const cartTrigger = page.getByRole("button", { name: /abrir carrinho/i });

        await expect(cartTrigger).toBeVisible();
        await cartTrigger.click();

        const drawer = page.getByRole("complementary", {
            name: /carrinho de compras/i,
        });

        await expect(drawer).toContainText(/nenhum item adicionado ainda/i);
        await expect(drawer.getByRole("link", { name: /finalizar pedido/i })).toHaveCount(0);
    });

    test("deve fechar o carrinho ao clicar no botão fechar", async ({ page }) => {
        await addPizzaCalabresaToCart(page);
        const drawer = await openCart(page);

        const closeButton = drawer.getByRole("button", { name: /fechar carrinho/i });
        await expect(closeButton).toBeVisible();

        await closeButton.click();

        await expect(drawer).toBeHidden();
    });

    test("deve aumentar quantidade no carrinho", async ({ page }) => {
        await addPizzaCalabresaToCart(page);
        const drawer = await openCart(page);

        const increaseButton = drawer.getByRole("button", {
            name: /aumentar quantidade de pizza calabresa/i,
        });

        await expect(increaseButton).toBeVisible();
        await increaseButton.click();

        await expect(drawer).toContainText(/2 item\(ns\)|\b2\b/);
    });

    test("deve diminuir quantidade no carrinho", async ({ page }) => {
        await addPizzaCalabresaToCart(page);
        const drawer = await openCart(page);

        const increaseButton = drawer.getByRole("button", {
            name: /aumentar quantidade de pizza calabresa/i,
        });

        const decreaseButton = drawer.getByRole("button", {
            name: /diminuir quantidade de pizza calabresa/i,
        });

        await expect(increaseButton).toBeVisible();
        await expect(decreaseButton).toBeVisible();

        await increaseButton.click();
        await expect(drawer).toContainText(/2 item\(ns\)|\b2\b/);

        await decreaseButton.click();
        await expect(drawer).toContainText(/1 item\(ns\)|\b1\b/);
    });

    test("deve remover item do carrinho", async ({ page }) => {
        await addPizzaCalabresaToCart(page);
        const drawer = await openCart(page);

        const removeAction = drawer.getByRole("button", { name: /remover/i });

        await expect(removeAction).toBeVisible();
        await removeAction.click();

        await expect(drawer).not.toContainText(/pizza calabresa/i);
    });

    test("subtotal deve atualizar ao alterar quantidade", async ({ page }) => {
        await addPizzaCalabresaToCart(page);
        const drawer = await openCart(page);

        const subtotalBefore = await drawer.getByText(/subtotal/i).locator("..").textContent();

        const increaseButton = drawer.getByRole("button", {
            name: /aumentar quantidade de pizza calabresa/i,
        });

        await increaseButton.click();

        await expect
            .poll(async () => {
                return await drawer.getByText(/subtotal/i).locator("..").textContent();
            })
            .not.toBe(subtotalBefore);
    });

    test("deve manter item no carrinho após recarregar a página", async ({ page }) => {
        await addPizzaCalabresaToCart(page);
        await page.reload();

        const cartTrigger = page.getByRole("button", { name: /abrir carrinho/i });
        await expect(cartTrigger).toContainText(/1 item/i);

        await cartTrigger.click();

        const drawer = page.getByRole("complementary", {
            name: /carrinho de compras/i,
        });

        await expect(drawer).toContainText(/pizza calabresa/i);
    });

    test("deve adicionar dois produtos diferentes ao carrinho", async ({ page }) => {
        await addPizzaCalabresaToCart(page);
        await closeCartIfOpen(page);
        await addPizzaFrangoToCart(page);

        const drawer = await openCart(page);

        await expect(drawer).toContainText(/pizza calabresa/i);
        await expect(drawer).toContainText(/pizza frango com catupiry/i);
        await expect(drawer).toContainText(/2 item\(ns\)|2 itens/i);
    });

    test("deve adicionar item com personalização", async ({ page }) => {
        await addCustomizedPizzaCalabresaToCart(page);

        const drawer = await openCart(page);

        await expect(drawer).toContainText(/pizza calabresa/i);
        await expect(drawer).toContainText(/sem cebola/i);
        await expect(drawer).toContainText(/sem tomate/i);
    });

    test("deve navegar para checkout ao clicar em finalizar pedido", async ({ page }) => {
        await addPizzaCalabresaToCart(page);
        const drawer = await openCart(page);

        const checkoutLink = drawer.getByRole("link", { name: /finalizar pedido/i });
        await expect(checkoutLink).toBeVisible();
        await checkoutLink.click();

        await expect(page).toHaveURL(/\/checkout$/);
    });
});