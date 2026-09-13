import { expect, test } from "@playwright/test";

function todayStamp(): string {
  const now = new Date();
  const mm = String(now.getMonth() + 1).padStart(2, "0");
  const dd = String(now.getDate()).padStart(2, "0");
  return `${now.getFullYear()}${mm}${dd}`;
}

test("lacak cucian dengan ticket dan telepon benar", async ({ page }) => {
  await page.goto("/lacak");
  await page.getByLabel("Nomor ticket").fill(`KMG-${todayStamp()}-001`);
  await page.getByLabel("Nomor telepon").fill("081233456712");
  await page.getByRole("button", { name: "Lacak" }).click();
  await expect(page.getByText(`KMG-${todayStamp()}-001`).first()).toBeVisible();
  await expect(page.getByText("Dicuci").first()).toBeVisible();
  await page.screenshot({ path: "e2e/screenshots/track.png", fullPage: true });
});

test("ticket salah menampilkan error jujur", async ({ page }) => {
  await page.goto("/lacak");
  await page.getByLabel("Nomor ticket").fill("XXX-20000101-999");
  await page.getByLabel("Nomor telepon").fill("080000000000");
  await page.getByRole("button", { name: "Lacak" }).click();
  await expect(page.getByText("Order tidak ditemukan")).toBeVisible();
});
