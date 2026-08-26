import type { MetadataRoute } from "next";
import { getBriefingSummaries, getEventSlugs } from "@/lib/content";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
  const routes = ["", "/archive", "/opportunities", "/trends", "/resources"];
  const [slugs, briefings] = await Promise.all([getEventSlugs(), getBriefingSummaries()]);
  return [
    ...routes.map((route) => ({ url: `${base}${route}`, changeFrequency: "daily" as const, priority: route === "" ? 1 : 0.7 })),
    ...briefings.map((briefing) => ({ url: `${base}/daily/${briefing.dateKst}`, changeFrequency: "monthly" as const, priority: 0.7 })),
    ...slugs.map((slug) => ({ url: `${base}/events/${slug}`, changeFrequency: "weekly" as const, priority: 0.8 })),
  ];
}
