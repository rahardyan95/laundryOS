import { expect, test } from "@playwright/test";
import { loginAsOwner } from "./helpers";

test("tombol tandai semua dibaca mengosongkan badge lonceng", async ({ page }) => {
  await loginAsOwner(page);
  await expect(page).toHaveURL(/\/dashboard/);

  await page.getByRole("button", { name: "Notifikasi" }).click();
  const clearButton = page.getByRole("button", { name: "Tandai semua dibaca" });
  await expect(clearButton).toBeVisible();
  await clearButton.click();

  await expect(page.getByText("9+")).toHaveCount(0);
  await expect(clearButton).toHaveCount(0);
  await expect(
    page.getByRole("button", { name: "Notifikasi" }).locator("span.absolute")
  ).toHaveCount(0);
});
