import type { MetadataRoute } from "next";
import { getEventSlugs } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const routes = ["", "/opportunities", "/trends"];
  return [...routes.map((route) => ({ url: `${base}${route}`, changeFrequency: "daily" as const, priority: route === "" ? 1 : 0.7 })), ...(await getEventSlugs()).map((slug) => ({ url: `${base}/events/${slug}`, changeFrequency: "weekly" as const, priority: 0.8 }))];
}
