import type { MetadataRoute } from "next";
import { Clock } from "@/lib/clock";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export default function sitemap(): MetadataRoute.Sitemap {
  const now = new Date(Clock.nowIso());
  return [
    { url: `${siteUrl}/`, lastModified: now, changeFrequency: "weekly", priority: 1 },
    { url: `${siteUrl}/lacak`, lastModified: now, changeFrequency: "monthly", priority: 0.4 },
    { url: `${siteUrl}/login`, lastModified: now, changeFrequency: "yearly", priority: 0.2 },
  ];
}
