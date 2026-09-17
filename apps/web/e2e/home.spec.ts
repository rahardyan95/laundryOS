import { expect, test } from "@playwright/test";
import { E2eAuth } from "./helpers";

test("home memuat navigasi dan CTA berfungsi", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Cucian tercatat/ })).toBeVisible();
  await expect(page.getByRole("link", { name: "Lacak Cucian" }).first()).toBeVisible();

  await page.getByRole("link", { name: "Lacak Sekarang" }).click();
  await expect(page).toHaveURL(/\/lacak/);

  await page.goto("/");
  await page.getByRole("link", { name: "Mulai Mencatat" }).click();
  await expect(page).toHaveURL(/\/login/);

  await page.goto("/");
  await page.screenshot({ path: "e2e/screenshots/home.png" });
  expect(errors).toEqual([]);
});

test("home mobile rapi", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto("/");
  await expect(page.getByRole("heading", { name: /Cucian tercatat/ })).toBeVisible();
  await page.getByRole("button", { name: "Buka menu" }).click();
  await expect(page.getByRole("link", { name: "Lacak Cucian" }).last()).toBeVisible();
  await page.screenshot({ path: "e2e/screenshots/home-mobile.png" });

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(390);
});

test("home full-load saat login tanpa hydration error", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await E2eAuth.loginAsOwner(page);
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/");
  await expect(page.getByRole("link", { name: "Buka Dashboard" }).first()).toBeVisible();
  expect(errors).toEqual([]);
});
