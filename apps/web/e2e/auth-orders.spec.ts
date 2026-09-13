import { expect, test } from "@playwright/test";
import { loginAsOwner } from "./helpers";

test("login owner, buat order, lanjut status, logout", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await loginAsOwner(page);
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByRole("heading", { name: /Selamat (pagi|siang|sore|malam)/ })).toBeVisible();
  await expect(page.getByText("order dibuat hari ini")).toBeVisible();
  await page.screenshot({ path: "e2e/screenshots/dashboard.png" });

  await page.goto("/orders/new");
  await page.getByLabel("Pilih pelanggan").click();
  await page.getByRole("option", { name: /Dewi Lestari/ }).click();
  await page.getByLabel("Layanan").first().click();
  await page.getByRole("option", { name: /Cuci Setrika/ }).first().click();
  await page.getByLabel("Jumlah").fill("2");
  await page.getByLabel("Dibayar (Rp)").fill("0");
  await page.getByRole("button", { name: "Simpan Order" }).click();

  await expect(page).toHaveURL(/\/orders\/.+/);
  const heading = page.getByRole("heading", { level: 1 });
  await expect(heading).toContainText(/KMG-\d{8}-\d{3}/);
  await page.screenshot({ path: "e2e/screenshots/order-detail.png" });

  await page.getByRole("button", { name: /Lanjut ke/ }).click();
  await expect(page.getByText("Dicuci").first()).toBeVisible();

  await page.getByRole("button", { name: "Keluar" }).click();
  await expect(page).toHaveURL(/\/login/);

  expect(errors).toEqual([]);
});
