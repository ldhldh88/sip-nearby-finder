import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const x = url.searchParams.get('x'); // longitude
    const y = url.searchParams.get('y'); // latitude
    const radius = url.searchParams.get('radius') || '2000';
    const sort = url.searchParams.get('sort') || 'accuracy';

    const KAKAO_REST_API_KEY = Deno.env.get('KAKAO_REST_API_KEY');
    if (!KAKAO_REST_API_KEY) {
      return new Response(JSON.stringify({ error: 'KAKAO_REST_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!x || !y) {
      return new Response(JSON.stringify({ error: 'x and y parameters are required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Fetch multiple pages to get more results for scoring
    const allDocuments: any[] = [];
    const pagesToFetch = 3; // 3 pages × 15 = up to 45 results

    for (let page = 1; page <= pagesToFetch; page++) {
      const params = new URLSearchParams({
        query: '술집',
        x,
        y,
        radius,
        sort,
        page: String(page),
        size: '15',
      });

      const kakaoRes = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?${params}`,
        { headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` } }
      );

      const data = await kakaoRes.json();
      if (!kakaoRes.ok) {
        return new Response(JSON.stringify(data), {
          status: kakaoRes.status,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }

      allDocuments.push(...data.documents);
      if (data.meta.is_end) break;
    }

    // Now try to get review/rating data by scraping place pages
    // We'll use category-based scoring + distance weighting as primary method
    const now = new Date();
    const hour = now.getHours();
    
    // Time-based multiplier (bars are hotter at night)
    const getTimeMult = (h: number) => {
      if (h >= 21 || h < 2) return 1.5;  // peak hours
      if (h >= 18 || h < 4) return 1.2;  // evening
      if (h >= 11 && h < 14) return 0.9; // lunch
      return 0.6; // off hours
    };

    // Category popularity weights
    const categoryWeights: Record<string, number> = {
      '호프,요리주점': 1.3,
      '칵테일바': 1.4,
      '와인바': 1.3,
      '이자카야': 1.2,
      '요리주점': 1.1,
      '포장마차': 1.0,
      '라운지바': 1.5,
      '민속주점': 0.9,
    };

    const timeMult = getTimeMult(hour);
    const radiusNum = parseInt(radius);

    const scoredPlaces = allDocuments.map((doc: any) => {
      const dist = parseInt(doc.distance) || radiusNum;
      
      // Distance score: closer = higher (0-40 points)
      const distScore = Math.max(0, 40 * (1 - dist / radiusNum));
      
      // Category score (0-20 points)
      const catParts = (doc.category_name || '').split(' > ');
      const shortCat = catParts[catParts.length - 1] || '';
      const catWeight = categoryWeights[shortCat] || 1.0;
      const catScore = 15 * catWeight;

      // Accuracy rank score (Kakao sorts by internal popularity for accuracy) (0-30 points)
      const rankIndex = allDocuments.indexOf(doc);
      const rankScore = Math.max(0, 30 * (1 - rankIndex / allDocuments.length));

      // Time multiplier applied to total
      const rawScore = distScore + catScore + rankScore;
      const hotScore = Math.round(rawScore * timeMult);

      return {
        ...doc,
        hotScore,
        distanceMeters: dist,
      };
    });

    // Sort by hotScore descending, take top 10
    scoredPlaces.sort((a: any, b: any) => b.hotScore - a.hotScore);
    const topPlaces = scoredPlaces.slice(0, 10);

    return new Response(JSON.stringify({
      places: topPlaces,
      total: allDocuments.length,
      timestamp: now.toISOString(),
    }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
