import { test, expect } from "@playwright/test";

for (const width of [320, 375, 768, 1024, 1440]) {
  test(`catalog is responsive at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto("./menu");
    await expect(page.locator("body")).toBeVisible();
    await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)).toBe(true);
    await page.screenshot({
      path: `test-results/catalog-${width}-${test.info().project.name}.png`,
      fullPage: true,
    });
  });
}
