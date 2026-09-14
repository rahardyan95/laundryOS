import type { APIRoute } from "astro";

// robots.txt digenerate saat build supaya host-nya selalu sama dengan `site`
// (PUBLIC_SITE_URL) — berkas statis di public/ tidak bisa membaca env dan
// gampang tertinggal saat domain berubah.
export const GET: APIRoute = ({ site }) => {
  const base = site ?? new URL("http://localhost:4321");
  const body = [
    "User-agent: *",
    "Allow: /",
    "",
    // @astrojs/sitemap menulis indeks di sitemap-index.xml.
    `Sitemap: ${new URL("sitemap-index.xml", base)}`,
    "",
  ].join("\n");

  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8" },
  });
};
