import type { Metadata } from "next";
import { HomeClient } from "@/components/landing/home-client";

export const metadata: Metadata = {
  title: "LaundryOS — Operasional Laundry dalam Satu Aplikasi",
  description:
    "Catat order, pantau status cucian tahap demi tahap, kelola pelanggan, antar-jemput, dan kas outlet dalam satu aplikasi untuk laundry kiloan & satuan.",
  openGraph: {
    title: "LaundryOS — Operasional Laundry dalam Satu Aplikasi",
    description:
      "Order tercatat, status terpantau, kas terkendali. Dibuat untuk UMKM laundry Indonesia.",
    locale: "id_ID",
    type: "website",
  },
};

export default function HomePage() {
  return <HomeClient />;
}
