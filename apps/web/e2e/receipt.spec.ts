import { expect, test } from "@playwright/test";

test("struk tampil rapi dalam emulasi print", async ({ page }) => {
  await page.goto("/login");
  await page.getByRole("button", { name: "Pemilik", exact: true }).click();
  await page.getByLabel("Kata sandi").fill("bebas");
  await page.getByRole("button", { name: "Masuk" }).click();
  await expect(page).toHaveURL(/\/dashboard/);

  await page.goto("/orders");
  await page.getByRole("link", { name: /KMG|TBT/ }).first().click();
  await expect(page).toHaveURL(/\/orders\/.+/);

  await page.emulateMedia({ media: "print" });
  await expect(page.getByText(/LUNAS/).first()).toBeVisible();
  await page.screenshot({ path: "e2e/screenshots/receipt-print.png", fullPage: true });
});
