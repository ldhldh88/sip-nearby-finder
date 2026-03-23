import "server-only";

import { prisma } from "@/lib/prisma";
import {
  kakaoService,
  SYNC_BAR_KEYWORDS,
  SYNC_CATEGORY_RADIUS,
} from "@/lib/kakao/kakao.service";

export interface SyncPlacesBody {
  district_id?: string;
  batch_limit?: number;
  batch_offset?: number;
  sync_all?: boolean;
}

export async function runDistrictPlacesSync(body: SyncPlacesBody): Promise<{
  message: string;
  synced: number;
  total_places: number;
}> {
  const apiKey = kakaoService.getRestApiKey();
  if (!apiKey) {
    throw new Error("KAKAO_REST_API_KEY not configured");
  }

  let districtIds: string[] = [];
  const batchLimit = body.batch_limit ?? 5;
  const batchOffset = body.batch_offset ?? 0;
  const syncAll = body.sync_all === true;

  if (body.district_id) {
    districtIds = [body.district_id];
  }

  if (districtIds.length === 0) {
    if (syncAll) {
      const allDistricts = await prisma.district.findMany({
        select: { id: true, name: true, province_id: true },
        orderBy: { sort_order: "asc" },
        skip: batchOffset,
        take: batchLimit,
      });
      districtIds = allDistricts.map((d) => d.id);
    } else {
      const dueDistricts = await prisma.district.findMany({
        where: {
          sync_interval_days: { not: null, gt: 0 },
        },
        select: {
          id: true,
          name: true,
          sync_interval_days: true,
          last_synced_at: true,
          province_id: true,
        },
      });

      const now = new Date();
      const due = dueDistricts.filter((d) => {
        if (!d.last_synced_at) return true;
        const diffDays =
          (now.getTime() - d.last_synced_at.getTime()) / (1000 * 60 * 60 * 24);
        return d.sync_interval_days != null && diffDays >= d.sync_interval_days;
      });

      districtIds = due.slice(0, batchLimit).map((d) => d.id);
    }
  }

  if (districtIds.length === 0) {
    return { message: "No districts due for sync", synced: 0, total_places: 0 };
  }

  const districtsToSync = await prisma.district.findMany({
    where: { id: { in: districtIds } },
    select: { id: true, name: true, province_id: true },
  });

  let totalSynced = 0;
  let totalPlaces = 0;

  for (const district of districtsToSync) {
    const subLocations = district.name
      .split("/")
      .map((s) => s.trim())
      .filter(Boolean);

    const allKeywordResults: Record<string, unknown>[][] = [];
    for (const loc of subLocations) {
      const locResults = await Promise.all(
        SYNC_BAR_KEYWORDS.map((kw) => kakaoService.fetchKeywordPagesForLocation(loc, kw))
      );
      allKeywordResults.push(...locResults);
    }

    const allCategoryResults: Record<string, unknown>[] = [];
    for (const loc of subLocations) {
      const center = await kakaoService.getCenterCoords(loc);
      if (center) {
        const catResults = await kakaoService.fetchCategoryBarPages(
          center.x,
          center.y,
          SYNC_CATEGORY_RADIUS
        );
        allCategoryResults.push(...catResults);
      }
    }

    const seen = new Set<string>();
    const unique: Record<string, unknown>[] = [];

    for (const docs of allKeywordResults) {
      for (const doc of docs) {
        const id = String((doc as { id?: string }).id ?? "");
        if (id && !seen.has(id)) {
          seen.add(id);
          unique.push(doc);
        }
      }
    }
    for (const doc of allCategoryResults) {
      const id = String((doc as { id?: string }).id ?? "");
      if (id && !seen.has(id)) {
        seen.add(id);
        unique.push(doc);
      }
    }

    await prisma.cachedPlace.deleteMany({
      where: { district_id: district.id },
    });

    if (unique.length > 0) {
      const batchSize = 50;
      for (let i = 0; i < unique.length; i += batchSize) {
        const batch = unique.slice(i, i + batchSize).map((doc) => ({
          district_id: district.id,
          kakao_place_id: String((doc as { id: string }).id),
          place_data: doc as object,
          updated_at: new Date(),
        }));

        await prisma.cachedPlace.createMany({
          data: batch,
          skipDuplicates: true,
        });
      }
    }

    await prisma.district.update({
      where: { id: district.id },
      data: { last_synced_at: new Date() },
    });

    totalSynced++;
    totalPlaces += unique.length;
  }

  return {
    message: `Synced ${totalSynced} district(s), ${totalPlaces} total places`,
    synced: totalSynced,
    total_places: totalPlaces,
  };
}
