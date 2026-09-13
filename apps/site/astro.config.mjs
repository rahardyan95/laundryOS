// @ts-check
import { defineConfig } from "astro/config";

export default defineConfig({
  site: process.env.PUBLIC_SITE_URL ?? "https://laundryos.example",
  output: "static",
  compressHTML: true,
});
