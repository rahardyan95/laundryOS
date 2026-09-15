import { expect, test } from "@playwright/test";
import { loginAsOwner } from "./helpers";

const pages = [
  ["/dashboard", /Selamat (pagi|siang|sore|malam)/],
  ["/orders", "Order"],
  ["/customers", "Pelanggan"],
  ["/catalog", "Katalog Layanan"],
  ["/cash", "Kas"],
  ["/reports", "Laporan"],
  ["/settings", "Pengaturan"],
] as const;

test("semua halaman utama tanpa console error", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await loginAsOwner(page);
  await expect(page).toHaveURL(/\/dashboard/);

  for (const [path, heading] of pages) {
    await page.goto(path);
    await expect(page.getByRole("heading", { name: heading, level: 1 })).toBeVisible();
  }

  await page.goto("/orders");
  await page.screenshot({ path: "e2e/screenshots/orders.png" });

  expect(errors).toEqual([]);
});

test("tampilan mobile 390px tanpa scroll horizontal", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });

  await page.setViewportSize({ width: 390, height: 844 });
  await loginAsOwner(page);
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText("order dibuat hari ini")).toBeVisible();
  await page.screenshot({ path: "e2e/screenshots/dashboard-mobile.png" });

  await page.goto("/orders/new");
  await expect(page.getByRole("heading", { name: "Order Baru", level: 1 })).toBeVisible();
  await page.screenshot({ path: "e2e/screenshots/pos-mobile.png" });

  const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  expect(scrollWidth).toBeLessThanOrEqual(390);
  expect(errors).toEqual([]);
});
