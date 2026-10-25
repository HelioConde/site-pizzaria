import { expect, test } from "@playwright/test";

for (const width of [320, 375, 768, 1440]) {
  test(`home redesign fits ${width}px and preserves interactive sections`, async ({ page }) => {
    await page.setViewportSize({ width, height: 860 });
    await page.goto("./");
    await expect(page.getByRole("heading", { name: "Do cardápio até a entrega" })).toBeVisible();
    await expect(page.getByRole("heading", { name: "Pronto para pedir sua pizza?" })).toBeVisible();

    const sizing = await page.evaluate(() => ({
      viewport: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      duplicateIds: [...document.querySelectorAll("[id]")]
        .map((node) => node.id)
        .filter((id, i, ids) => ids.indexOf(id) !== i),
    }));
    expect(sizing.documentWidth, JSON.stringify(sizing)).toBeLessThanOrEqual(sizing.viewport + 2);
    expect(sizing.duplicateIds).toEqual([]);

    await page.screenshot({
      path: `test-results/home-redesign-${width}-${test.info().project.name}.png`,
      fullPage: true,
    });
  });
}
