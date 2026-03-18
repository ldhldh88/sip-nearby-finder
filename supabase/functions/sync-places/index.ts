import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-admin-token, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BAR_KEYWORDS = ['술집', '호프', '와인바', '칵테일바', '포차', '이자카야', '요리주점'];
const KAKAO_PAGE_LIMIT = 3;
const KAKAO_PAGE_SIZE = 15;

async function fetchAllPagesForKeyword(
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

    // Check if this is a manual call (specific district_id) or scheduled (check all due)
    let districtIds: string[] = [];
    let batchLimit = 5; // Process max 5 districts per invocation

    try {
      const body = await req.json();
      if (body.district_id) {
        districtIds = [body.district_id];
      }
      if (body.batch_limit) {
        batchLimit = body.batch_limit;
      }
    } catch {
      // No body or parse error = scheduled call, find due districts
    }

    if (districtIds.length === 0) {
      // Find districts due for sync based on sync_interval_days
      const { data: dueDistricts, error: dErr } = await supabase
        .from('districts')
        .select('id, name, sync_interval_days, last_synced_at, province_id')
        .not('sync_interval_days', 'is', null)
        .gt('sync_interval_days', 0);

      if (dErr) throw dErr;

      const now = new Date();
      const due = (dueDistricts || []).filter((d: any) => {
        if (!d.last_synced_at) return true; // Never synced
        const lastSync = new Date(d.last_synced_at);
        const diffDays = (now.getTime() - lastSync.getTime()) / (1000 * 60 * 60 * 24);
        return diffDays >= d.sync_interval_days;
      });

      // Only take batchLimit districts
      districtIds = due.slice(0, batchLimit).map((d: any) => d.id);
      console.log(`Scheduled sync: processing ${districtIds.length} of ${due.length} due districts (batch limit: ${batchLimit})`);
    }

    if (districtIds.length === 0) {
      return new Response(JSON.stringify({ message: 'No districts due for sync', synced: 0 }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch district details
    const { data: districtsToSync, error: fetchErr } = await supabase
      .from('districts')
      .select('id, name, province_id')
      .in('id', districtIds);
    if (fetchErr) throw fetchErr;

    let totalSynced = 0;
    let totalPlaces = 0;

    for (const district of districtsToSync || []) {
      // Split slash-separated name and search each sub-location separately
      const subLocations = district.name.split('/').map((s: string) => s.trim()).filter(Boolean);
      console.log(`Syncing district: ${district.name} (sub-locations: ${subLocations.join(', ')})`);

      // Fetch from Kakao using multi-keyword strategy for EACH sub-location
      const allResults: any[][] = [];
      for (const loc of subLocations) {
        const locResults = await Promise.all(
          BAR_KEYWORDS.map((kw) => fetchAllPagesForKeyword(KAKAO_REST_API_KEY, loc, kw)),
        );
        allResults.push(...locResults);
      }

      // Deduplicate by place id
      const seen = new Set<string>();
      const unique: any[] = [];
      for (const docs of allResults) {
        for (const doc of docs) {
          if (!seen.has(doc.id)) {
            seen.add(doc.id);
            unique.push(doc);
          }
        }
      }

      console.log(`  Found ${unique.length} unique places for ${district.name}`);

      // Replace cached data: delete old, insert new
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
            console.error(`  Batch upsert error for ${location}:`, upsertErr.message);
          }
        }
      }

      // Update last_synced_at
      await supabase
        .from('districts')
        .update({ last_synced_at: new Date().toISOString() })
        .eq('id', district.id);

      totalSynced++;
      totalPlaces += unique.length;
      console.log(`  Completed sync for ${location}: ${unique.length} places cached`);
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
