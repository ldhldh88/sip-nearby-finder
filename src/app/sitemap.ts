import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";
import { getSiteUrl } from "@/lib/site";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const base = getSiteUrl();
  const lastModified = new Date();

  const staticRoutes = ["", "/explore", "/about", "/contact", "/privacy", "/terms"];
  const entries: MetadataRoute.Sitemap = staticRoutes.map((path) => ({
    url: `${base}${path || "/"}`,
    lastModified,
    changeFrequency: path === "" || path === "/explore" ? "daily" : "monthly",
    priority: path === "" ? 1 : path === "/explore" ? 0.95 : 0.6,
  }));

  try {
    const [groupedPlaces, districts] = await Promise.all([
      prisma.cachedPlace.groupBy({
        by: ["kakao_place_id"],
        _max: { updated_at: true },
      }),
      prisma.district.findMany({
        include: { province: { select: { name: true } } },
      }),
    ]);

    for (const row of groupedPlaces) {
      const updated = row._max.updated_at ?? lastModified;
      entries.push({
        url: `${base}/bar/${encodeURIComponent(row.kakao_place_id)}`,
        lastModified: updated,
        changeFrequency: "weekly",
        priority: 0.85,
      });
    }

    for (const d of districts) {
      const q = new URLSearchParams();
      q.set("province", d.province.name);
      q.set("district", d.name);
      entries.push({
        url: `${base}/explore?${q.toString()}`,
        lastModified,
        changeFrequency: "weekly",
        priority: 0.75,
      });
    }
  } catch (e) {
    console.error("[sitemap] DB error (skipped bar/district URLs):", e);
  }

  return entries;
}
