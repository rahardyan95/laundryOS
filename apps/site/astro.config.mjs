// @ts-check
import { defineConfig } from "astro/config";
import sitemap from "@astrojs/sitemap";

// `site` menentukan canonical, robots.txt, dan sitemap.xml.
// Sumbernya PUBLIC_SITE_URL (host publik situs) atau PUBLIC_APP_URL. Build
// produksi lewat Dockerfile.prod yang menolak build tanpa keduanya, jadi nilai
// loopback di bawah hanya berlaku untuk `astro dev` / build lokal tanpa env.
const site =
  process.env.PUBLIC_SITE_URL ?? process.env.PUBLIC_APP_URL ?? "http://localhost:4321";

export default defineConfig({
  site,
  output: "static",
  compressHTML: true,
  integrations: [sitemap()],
});
