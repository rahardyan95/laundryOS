import { expect, test } from "@playwright/test";

test("login nyata via cookie httpOnly lalu dashboard tampil", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Kata sandi").fill("password");
  await page.getByRole("button", { name: "Masuk" }).click();

  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });
  await expect(page.getByRole("heading", { name: "Dashboard", level: 1 })).toBeVisible();

  const tokenInStorage = await page.evaluate(() => {
    return (
      window.localStorage.getItem("laundryos.token") ??
      window.sessionStorage.getItem("laundryos.token")
    );
  });
  expect(tokenInStorage).toBeNull();
});

test("daftar order memuat data dari API nyata", async ({ page }) => {
  await page.goto("/login");
  await page.getByLabel("Kata sandi").fill("password");
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/\/dashboard/, { timeout: 20_000 });

  await page.goto("/orders");
  await expect(page.getByRole("heading", { name: "Order", level: 1 })).toBeVisible();
  await expect(page.locator("table tbody tr").first()).toBeVisible({ timeout: 20_000 });
});
