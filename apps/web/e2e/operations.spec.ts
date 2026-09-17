import { expect, test } from "@playwright/test";
import { E2eAuth } from "./helpers";

test("buat customer baru tampil di tabel", async ({ page }) => {
  await E2eAuth.loginAsOwner(page);
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/customers");
  await page.getByRole("button", { name: "Pelanggan Baru" }).click();
  await page.getByLabel("Nama").fill("E2E Customer");
  await page.getByLabel("Telepon").fill("0800000001");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page.getByText("E2E Customer").first()).toBeVisible();
});

test("catat kas, tutup, kunci entry, buka kembali", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));

  await E2eAuth.loginAsOwner(page);
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/cash");
  await expect(page.getByText("Terbuka")).toBeVisible();

  await page.getByRole("button", { name: "Catat Kas" }).click();
  await page.getByLabel("Nominal (Rp)").fill("100000");
  await page.getByRole("button", { name: "Simpan" }).click();
  await expect(page.getByText(/350\.000/)).toBeVisible();

  await page.getByRole("button", { name: "Tutup Kas Hari Ini" }).click();
  await expect(page.getByText("Ditutup")).toBeVisible();
  await expect(page.getByRole("button", { name: "Catat Kas" })).toHaveCount(0);

  await page.getByRole("button", { name: "Buka Kembali" }).click();
  await expect(page.getByText("Terbuka")).toBeVisible();

  expect(errors).toEqual([]);
});
