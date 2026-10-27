import { expect, test } from "@playwright/test";

const productId = "11111111-1111-4111-8111-111111111111";
const products = [
  {
    id: productId, slug: "calabresa", name: "Pizza Calabresa",
    description: "Calabresa com cebola", price: 35, old_price: 25,
    rating: 4.5, tag: "Clássica", image_url: null,
    is_active: true, is_featured: true, sort_order: 1, created_at: "2026-01-01",
    category_id: "category-1",
  },
  {
    id: "22222222-2222-4222-8222-222222222222",
    slug: "mussarela", name: "Pizza Mussarela",
    description: "Queijo e tomate", price: 30, old_price: 40,
    rating: 4.9, tag: "Oferta", image_url: null,
    is_active: true, is_featured: true, sort_order: 2, created_at: "2026-01-01",
    category_id: "category-1",
  },
];

async function mockCatalog(page) {
  await page.route("**/rest/v1/products?*", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(products) });
  });
  await page.route("**/rest/v1/product_categories?*", async (route) => {
    await route.fulfill({
      status: 200, contentType: "application/json",
      body: JSON.stringify([
        { id: "category-1", slug: "tradicionais", name: "Tradicionais", is_active: true, sort_order: 1, created_at: "2026-01-01" },
      ]),
    });
  });
  await page.route("**/rest/v1/store_settings?*", async (route) => {
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify({ delivery_fee: 6.9, estimated_delivery_time: 45 }) });
  });
}

test("catalog displays actual savings, accessible result count and product customization", async ({ page }) => {
  await mockCatalog(page);
  await page.goto("./menu");

  const calabresa = page.locator("article").filter({ has: page.getByRole("heading", { name: "Pizza Calabresa" }) });
  const mussarela = page.locator("article").filter({ has: page.getByRole("heading", { name: "Pizza Mussarela" }) });
  await expect(calabresa).toBeVisible();
  await expect(mussarela).toBeVisible();
  await expect(calabresa).not.toContainText(/R\$\s*25,00/);
  await expect(mussarela).toContainText(/R\$\s*40,00/);
  await expect(page.getByRole("status").filter({ hasText: /Mostrando 2 produtos/ })).toBeVisible();

  await calabresa.getByRole("button", { name: /Personalizar e adicionar Pizza Calabresa/i }).click();
  const modal = page.getByRole("dialog", { name: "Personalizar produto" });
  await expect(modal).toBeVisible();
  await modal.getByRole("checkbox", { name: "Sem cebola" }).check();
  await modal.getByRole("textbox", { name: "Observações" }).fill("Bem assada");
  await modal.getByRole("button", { name: "Adicionar ao carrinho" }).click();

  const cart = page.getByRole("dialog", { name: "Carrinho de compras" });
  await expect(cart).toBeVisible();
  await expect(cart).toContainText("Bem assada");
  await expect(cart).toContainText("Sem cebola");
  await expect(cart).toContainText(/R\$\s*35,00/);
});

test("full persisted cart explains its limit and blocks adding a new entry", async ({ page }) => {
  await mockCatalog(page);
  await page.addInitScript(() => {
    const stored = Array.from({ length: 100 }, (_, i) => ({
      id: `saved-${i}`, productId: "other-product",
      name: `Pizza ${i}`, quantity: 1, price: 20,
    }));
    localStorage.setItem("base-studio-pizzas-cart", JSON.stringify(stored));
  });
  await page.goto("./menu");
  const product = page.locator("article").filter({ has: page.getByRole("heading", { name: "Pizza Calabresa" }) });
  await expect(product).toBeVisible();
  await product.getByRole("button", { name: /Personalizar e adicionar Pizza Calabresa/i }).click();

  const modal = page.getByRole("dialog", { name: "Personalizar produto" });
  await expect(modal).toContainText("limite de 100 produtos diferentes");
  await expect(modal.getByRole("button", { name: "Adicionar ao carrinho" })).toBeDisabled();
  await modal.getByRole("button", { name: "Fechar personalização" }).click();

  const persistedLength = await page.evaluate(() =>
    JSON.parse(localStorage.getItem("base-studio-pizzas-cart") || "[]").length
  );
  expect(persistedLength).toBe(100);
});

test("maximum item quantity disables increment with feedback", async ({ page }) => {
  await page.addInitScript(() => {
    localStorage.setItem("base-studio-pizzas-cart", JSON.stringify([
      { id: "saved-maximum", productId: "pizza-1", name: "Pizza Teste", price: 30, quantity: 99 },
    ]));
  });
  await page.goto("./menu");
  await page.getByRole("button", { name: /Abrir carrinho/i }).click();
  const cart = page.getByRole("dialog", { name: "Carrinho de compras" });
  await expect(cart.getByRole("button", { name: "Aumentar quantidade de Pizza Teste" })).toBeDisabled();
  await expect(cart).toContainText("Máximo de 99 unidades");
});
