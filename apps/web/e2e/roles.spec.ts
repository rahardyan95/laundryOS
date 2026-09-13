import { expect, test, type Page } from "@playwright/test";

async function loginAs(page: Page, chip: string): Promise<void> {
  await page.goto("/login");
  await page.getByRole("button", { name: chip, exact: true }).click();
  await page.getByLabel("Kata sandi").fill("bebas");
  await page.getByRole("button", { name: "Masuk" }).click();
}

test("kurir hanya melihat menu antar-jemput dan diarahkan dari halaman lain", async ({
  page,
}) => {
  await loginAs(page, "Kurir");
  await expect(page).toHaveURL(/\/tasks/);
  await expect(page.getByRole("link", { name: "Antar-Jemput" })).toBeVisible();
  await expect(page.getByRole("link", { name: "Order" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Task Baru" })).toHaveCount(0);

  await page.goto("/orders/new");
  await expect(page).toHaveURL(/\/tasks/);
  await page.goto("/dashboard");
  await expect(page).toHaveURL(/\/tasks/);
});

test("operator diarahkan dari halaman kas, task, dan order baru", async ({ page }) => {
  await loginAs(page, "Operator");
  await expect(page).toHaveURL(/\/orders/);

  await page.goto("/orders/new");
  await expect(page).toHaveURL(/\/orders$/);
  await page.goto("/tasks");
  await expect(page).toHaveURL(/\/orders$/);
  await page.goto("/cash");
  await expect(page).toHaveURL(/\/orders$/);
});

test("kasir di detail order tanpa tombol lanjut tapi bisa batalkan", async ({ page }) => {
  await loginAs(page, "Kasir");
  await expect(page).toHaveURL(/\/orders$/);

  await page.goto("/orders");
  await page.getByRole("link", { name: /KMG|TBT/ }).first().click();
  await expect(page).toHaveURL(/\/orders\/.+/);
  await expect(page.getByRole("button", { name: /Lanjut ke/ })).toHaveCount(0);
});

test("kasir tidak melihat menu pengaturan dan laporan", async ({ page }) => {
  await loginAs(page, "Kasir");
  await expect(page).toHaveURL(/\/orders$/);

  await expect(page.getByRole("link", { name: "Pengaturan" })).toHaveCount(0);
  await expect(page.getByRole("link", { name: "Laporan" })).toHaveCount(0);
  await page.goto("/reports");
  await expect(page).toHaveURL(/\/orders$/);
});
