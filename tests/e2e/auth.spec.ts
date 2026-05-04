import { test, expect } from "@playwright/test";

test("login page renders the Anômalo brand", async ({ page }) => {
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: /anômalo/i })).toBeVisible();
  await expect(page.getByLabel(/email/i)).toBeVisible();
  await expect(page.getByLabel(/senha/i)).toBeVisible();
});

test("login redirects unauthenticated user from /dashboard", async ({ page }) => {
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/login$/);
});

test("invalid login shows error", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel(/email/i).fill("nope@example.com");
  await page.getByLabel(/senha/i).fill("wrongpw");
  await page.getByRole("button", { name: /entrar/i }).click();
  await expect(page.getByText(/email ou senha inválidos|invalid/i)).toBeVisible({ timeout: 8000 });
});
