import { test, expect } from "@playwright/test";

for (const width of [320, 375, 768, 1024, 1440]) {
  test(`catalog is responsive at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: 850 });
    await page.goto("./menu");
    await expect(page.locator("body")).toBeVisible();
    const layout = await page.evaluate(() => ({
      viewport: innerWidth,
      scrollWidth: document.documentElement.scrollWidth,
      offenders: [...document.querySelectorAll("body *")].map((element) => {
        const rect = element.getBoundingClientRect();
        return {tag: element.tagName, className: typeof element.className === "string" ? element.className : "", left: Math.round(rect.left), right: Math.round(rect.right)};
      }).filter(item => item.right > innerWidth + 2 || item.left < -2).slice(0, 20),
    }));
    expect(layout.scrollWidth, JSON.stringify(layout)).toBeLessThanOrEqual(layout.viewport + 2);
    await page.screenshot({
      path: `test-results/catalog-${width}-${test.info().project.name}.png`,
      fullPage: true,
    });
  });
}
