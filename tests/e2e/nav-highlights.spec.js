import { test, expect } from "@playwright/test";

for (const width of [320, 375, 768]) {
  test(`mobile menu traps focus and fits ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 820 });
    await page.goto("./");

    const trigger = page.getByRole("button", { name: "Abrir menu" });
    await expect(trigger).toBeVisible();
    await trigger.click();

    const dialog = page.getByRole("dialog", { name: "Menu de navegação" });
    await expect(dialog).toBeVisible();
    await expect(dialog.getByRole("link", { name: "Início", exact: true })).toBeFocused();

    await page.keyboard.press("Shift+Tab");
    await expect(dialog.getByRole("link", { name: /Fazer pedido/i })).toBeFocused();
    await page.keyboard.press("Tab");
    await expect(dialog.getByRole("link", { name: "Início", exact: true })).toBeFocused();

    const sizing = await page.evaluate(() => ({
      viewport: innerWidth,
      width: document.documentElement.scrollWidth,
      overflowLock: document.body.style.overflow,
    }));
    expect(sizing.width, JSON.stringify(sizing)).toBeLessThanOrEqual(sizing.viewport + 2);
    expect(sizing.overflowLock).toBe("hidden");
    await page.screenshot({
      path: `test-results/mobile-menu-${width}-${test.info().project.name}.png`,
      fullPage: false,
    });

    await page.keyboard.press("Escape");
    await expect(dialog).toBeHidden();
    await expect(page.getByRole("button", { name: "Abrir menu" })).toBeFocused();
  });
}

test("featured product cards provide clear menu access with realistic discounts", async ({ page }) => {
  await page.route("**/rest/v1/product_sales_summary?*", async (route) => {
    const products = [
      {
        product_id: "11111111-1111-4111-8111-111111111111",
        slug: "calabresa",
        name: "Pizza Calabresa",
        description: "Calabresa e cebola",
        price: 35, old_price: 42, rating: 4.8, tag: "Favorita",
        image_url: null, is_active: true, is_featured: true, sort_order: 99, total_sold: 200,
      },
      {
        product_id: "22222222-2222-4222-8222-222222222222",
        slug: "mussarela",
        name: "Pizza Mussarela",
        description: "Mussarela e tomate",
        price: 38, old_price: 30, rating: 4.5, tag: "Clássica",
        image_url: null, is_active: true, is_featured: true, sort_order: 1, total_sold: 20,
      },
    ];
    await route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(products) });
  });
  await page.goto("./");
  const section = page.locator('#destaques section[aria-label="Destaques"]');
  await expect(section).toBeVisible();
  await expect(section.getByRole("link", { name: /Ver cardápio completo/i })).toBeVisible();
  await expect(section.getByRole("link", { name: /Abrir Pizza Calabresa para personalizar/i })).toHaveCount(2);
  await expect(section.getByRole("link", { name: /Abrir Pizza Mussarela para personalizar/i })).toHaveCount(1);
  await expect(section).toContainText(/R\$\s*35,00/);
  await expect(section).not.toContainText(/R\$\s*30,00/);
});
