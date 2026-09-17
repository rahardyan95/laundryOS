import { expect, test } from "@playwright/test";
import { E2eAuth } from "./helpers";

// Visual regression menyimpan baseline per-platform. Jalankan dengan:
//   $env:VISUAL="1"; pnpm exec playwright test e2e/visual.spec.ts
// Baseline akan dibuat otomatis saat pertama kali, lalu dibandingkan.
test.skip(!process.env.VISUAL, "Set VISUAL=1 untuk menjalankan visual regression");

test("dashboard tampilan stabil", async ({ page }) => {
  await page.setViewportSize({ width: 1280, height: 900 });
  await E2eAuth.loginAsOwner(page);
  await expect(page).toHaveURL(/\/dashboard/);
  await expect(page.getByText("order dibuat hari ini")).toBeVisible();

  await expect(page).toHaveScreenshot("dashboard.png", {
    maxDiffPixelRatio: 0.02,
    animations: "disabled",
  });
});
