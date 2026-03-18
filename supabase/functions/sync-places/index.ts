import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BAR_KEYWORDS = ['술집', '호프', '와인바', '칵테일바', '포차', '이자카야', '요리주점'];
const KAKAO_PAGE_LIMIT = 3;
const KAKAO_PAGE_SIZE = 15;
// Category search: FD6 = 음식점 (includes bars)
const CATEGORY_CODE = 'FD6';
const CATEGORY_RADIUS = 2000; // 2km radius
const CATEGORY_PAGE_LIMIT = 5;

/** Keyword search: location + keyword */
async function fetchKeywordPages(
  apiKey: string,
  location: string,
  keyword: string,
): Promise<any[]> {
  const results: any[] = [];
  for (let page = 1; page <= KAKAO_PAGE_LIMIT; page++) {
    const params = new URLSearchParams({
      query: `${location} ${keyword}`,
      page: String(page),
      size: String(KAKAO_PAGE_SIZE),
      sort: 'accuracy',
    });
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/keyword.json?${params}`,
      { headers: { Authorization: `KakaoAK ${apiKey}` } },
    );
    if (!res.ok) break;
    const data = await res.json();
    results.push(...data.documents);
    if (data.meta.is_end) break;
  }
  return results;
}

/** Get center coordinates for a location by simple keyword search */
async function getCenterCoords(
  apiKey: string,
  location: string,
): Promise<{ x: string; y: string } | null> {
  const params = new URLSearchParams({
    query: `${location} 술집`,
    page: '1',
    size: '1',
    sort: 'accuracy',
  });
  const res = await fetch(
    `https://dapi.kakao.com/v2/local/search/keyword.json?${params}`,
    { headers: { Authorization: `KakaoAK ${apiKey}` } },
  );
  if (!res.ok) return null;
  const data = await res.json();
  if (data.documents.length === 0) return null;
  return { x: data.documents[0].x, y: data.documents[0].y };
}

/** Category search: coordinate + radius based */
async function fetchCategoryPages(
  apiKey: string,
  x: string,
  y: string,
  radius: number,
): Promise<any[]> {
  const results: any[] = [];
  for (let page = 1; page <= CATEGORY_PAGE_LIMIT; page++) {
    const params = new URLSearchParams({
      category_group_code: CATEGORY_CODE,
      x,
      y,
      radius: String(radius),
      page: String(page),
      size: String(KAKAO_PAGE_SIZE),
      sort: 'distance',
    });
    const res = await fetch(
      `https://dapi.kakao.com/v2/local/search/category.json?${params}`,
      { headers: { Authorization: `KakaoAK ${apiKey}` } },
    );
    if (!res.ok) break;
    const data = await res.json();
    // Filter only bar-related categories
    const barDocs = data.documents.filter((doc: any) =>
      doc.category_name?.includes('술집') ||
      doc.category_name?.includes('호프') ||
      doc.category_name?.includes('와인바') ||
      doc.category_name?.includes('칵테일') ||
      doc.category_name?.includes('포차') ||
      doc.category_name?.includes('이자카야') ||
      doc.category_name?.includes('요리주점') ||
      doc.category_name?.includes('바(BAR)') ||
      doc.category_name?.includes('맥주') ||
      doc.category_name?.includes('펍')
    );
    results.push(...barDocs);
    if (data.meta.is_end) break;
  }
  return results;
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const KAKAO_REST_API_KEY = Deno.env.get('KAKAO_REST_API_KEY');
    const supabase = createClient(
      Deno.env.get('SUPABASE_URL')!,
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!,
    );

    if (!KAKAO_REST_API_KEY) {
      return new Response(JSON.stringify({ error: 'KAKAO_REST_API_KEY not configured' }), {
        status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Parse request body
    let districtIds: string[] = [];
    let batchLimit = 5;
    let batchOffset = 0;
    let syncAll = false;

    try {
      const body = await req.json();
      if (body.district_id) districtIds = [body.district_id];
      if (body.batch_limit) batchLimit = body.batch_limit;
      if (body.batch_offset) batchOffset = body.batch_offset;
      if (body.sync_all) syncAll = true;
    } catch {
      // No body = scheduled call
    }

    if (districtIds.length === 0) {
      if (syncAll) {
        const { data: allDistricts, error: aErr } = await supabase
          .from('districts')
          .select('id, name, province_id')
          .order('sort_order')
          .range(batchOffset, batchOffset + batchLimit - 1);
        if (aErr) throw aErr;
        districtIds = (allDistricts || []).map((d: any) => d.id);
        console.log(`Sync all: processing ${districtIds.length} districts (offset: ${batchOffset}, limit: ${batchLimit})`);
      } else {
        const { data: dueDistricts, error: dErr } = await supabase
          .from('districts')
          .select('id, name, sync_interval_days, last_synced_at, province_id')
          .not('sync_interval_days', 'is', null)
          .gt('sync_interval_days', 0);
        if (dErr) throw dErr;

        const now = new Date();
        const due = (dueDistricts || []).filter((d: any) => {
          if (!d.last_synced_at) return true;
          const lastSync = new Date(d.last_synced_at);
          const diffDays = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60 * 24);
          return diffDays >= d.sync_interval_days;
        });

        districtIds = due.slice(0, batchLimit).map((d: any) => d.id);
        console.log(`Scheduled sync: processing ${districtIds.length} of ${due.length} due districts`);
      }
    }

    if (districtIds.length === 0) {
      return new Response(JSON.stringify({ message: 'No districts due for sync', synced: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const { data: districtsToSync, error: fetchErr } = await supabase
      .from('districts')
      .select('id, name, province_id')
      .in('id', districtIds);
    if (fetchErr) throw fetchErr;

    let totalSynced = 0;
    let totalPlaces = 0;

    for (const district of districtsToSync || []) {
      const subLocations = district.name.split('/').map((s: string) => s.trim()).filter(Boolean);
      console.log(`Syncing district: ${district.name} (sub-locations: ${subLocations.join(', ')})`);

      // 1) Keyword search for each sub-location
      const allKeywordResults: any[][] = [];
      for (const loc of subLocations) {
        const locResults = await Promise.all(
          BAR_KEYWORDS.map((kw) => fetchKeywordPages(KAKAO_REST_API_KEY, loc, kw)),
        );
        allKeywordResults.push(...locResults);
      }

      // 2) Category (coordinate-based) search for each sub-location
      const allCategoryResults: any[] = [];
      for (const loc of subLocations) {
        const center = await getCenterCoords(KAKAO_REST_API_KEY, loc);
        if (center) {
          console.log(`  Category search for ${loc} at (${center.x}, ${center.y}) radius ${CATEGORY_RADIUS}m`);
          const catResults = await fetchCategoryPages(
            KAKAO_REST_API_KEY, center.x, center.y, CATEGORY_RADIUS,
          );
          allCategoryResults.push(...catResults);
          console.log(`  Category search found ${catResults.length} bar-type places for ${loc}`);
        }
      }

      // 3) Deduplicate all results
      const seen = new Set<string>();
      const unique: any[] = [];
      // Add keyword results first
      for (const docs of allKeywordResults) {
        for (const doc of docs) {
          if (!seen.has(doc.id)) {
            seen.add(doc.id);
            unique.push(doc);
          }
        }
      }
      // Then add category results
      for (const doc of allCategoryResults) {
        if (!seen.has(doc.id)) {
          seen.add(doc.id);
          unique.push(doc);
        }
      }

      console.log(`  Found ${unique.length} unique places for ${district.name} (keyword: ${unique.length - allCategoryResults.filter(d => !seen.has(d.id)).length}, category added new ones)`);

      // Replace cached data
      await supabase
        .from('cached_places')
        .delete()
        .eq('district_id', district.id);

      if (unique.length > 0) {
        const batchSize = 50;
        for (let i = 0; i < unique.length; i += batchSize) {
          const batch = unique.slice(i, i + batchSize).map((doc: any) => ({
            district_id: district.id,
            kakao_place_id: doc.id,
            place_data: doc,
            updated_at: new Date().toISOString(),
          }));

          const { error: upsertErr } = await supabase
            .from('cached_places')
            .upsert(batch, { onConflict: 'district_id,kakao_place_id' });

          if (upsertErr) {
            console.error(`  Batch upsert error:`, upsertErr.message);
          }
        }
      }

      await supabase
        .from('districts')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', district.id);

      totalSynced++;
      totalPlaces += unique.length;
      console.log(`  Completed sync for ${district.name}: ${unique.length} places cached`);
    }

    return new Response(JSON.stringify({
      message: `Synced ${totalSynced} district(s), ${totalPlaces} total places`,
      synced: totalSynced,
      total_places: totalPlaces,
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    console.error('Sync error:', error);
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
