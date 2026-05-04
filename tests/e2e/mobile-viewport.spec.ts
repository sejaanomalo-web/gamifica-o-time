import { test, expect } from "@playwright/test";

test("login renders cleanly on iPhone 13 Mini", async ({ page }) => {
  await page.goto("/login");
  // No horizontal overflow
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
  );
  expect(overflow).toBe(false);
});
