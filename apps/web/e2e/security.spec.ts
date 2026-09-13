import { expect, test } from "@playwright/test";

test("header keamanan, robots, dan manifest tersedia", async ({ request }) => {
  const home = await request.get("/");
  expect(home.status()).toBe(200);
  expect(home.headers()["content-security-policy"]).toContain("default-src 'self'");
  expect(home.headers()["x-frame-options"]).toBe("DENY");
  expect(home.headers()["x-content-type-options"]).toBe("nosniff");
  expect(home.headers()["x-powered-by"]).toBeUndefined();

  expect((await request.get("/robots.txt")).status()).toBe(200);
  expect((await request.get("/manifest.webmanifest")).status()).toBe(200);
  expect((await request.get("/sitemap.xml")).status()).toBe(200);
});

test("halaman tidak ditemukan menampilkan 404 yang rapi", async ({ page }) => {
  await page.goto("/halaman-tidak-ada");
  await expect(page.getByRole("heading", { name: "Halaman tidak ditemukan" })).toBeVisible();
});
