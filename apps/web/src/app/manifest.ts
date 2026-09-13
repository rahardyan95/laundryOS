import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "LaundryOS",
    short_name: "LaundryOS",
    description:
      "Kelola operasional laundry: order, status cucian, pelanggan, antar-jemput, dan kas dalam satu aplikasi.",
    start_url: "/",
    display: "standalone",
    background_color: "#faf9f6",
    theme_color: "#1f5c4a",
    lang: "id",
    icons: [
      { src: "/icon.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
    ],
  };
}
