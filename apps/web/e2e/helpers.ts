import type { Page } from "@playwright/test";

export class E2eAuth {
  static async loginAsOwner(page: Page): Promise<void> {
    await page.goto("/login");
    await page.getByRole("button", { name: "Pemilik" }).click();
    await page.getByLabel("Kata sandi").fill("bebas");
    await page.getByRole("button", { name: "Masuk" }).click();
  }
}
