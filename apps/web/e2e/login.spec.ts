import { expect, test } from "@playwright/test";

test("halaman login split brand panel dan form", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Masuk" })).toBeVisible();
  await expect(page.getByText("Operasional laundry, rapi setiap hari.")).toBeVisible();
  await expect(page.getByRole("button", { name: "Kurir" })).toBeVisible();
  await page.screenshot({ path: "e2e/screenshots/login.png" });
  expect(errors).toEqual([]);
});

test("halaman login mobile menumpuk rapi", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/login");
  await expect(page.getByRole("heading", { name: "Masuk" })).toBeVisible();
  await page.screenshot({ path: "e2e/screenshots/login-mobile.png" });

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(390);
});
