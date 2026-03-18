import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version',
};

const BAR_KEYWORDS = ['술집', '호프', '와인바', '칵테일바', '포차', '이자카야', '요리주점'];
const KAKAO_PAGE_LIMIT = 3; // Kakao max 3 pages per keyword
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
    const url = new URL(req.url);
    const query = url.searchParams.get('query');
    const page = parseInt(url.searchParams.get('page') || '1');
    const size = parseInt(url.searchParams.get('size') || '15');
    const mode = url.searchParams.get('mode'); // 'simple' for search bar

    const KAKAO_REST_API_KEY = Deno.env.get('KAKAO_REST_API_KEY');
    if (!KAKAO_REST_API_KEY) {
      return new Response(JSON.stringify({ error: 'KAKAO_REST_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    if (!query) {
      return new Response(JSON.stringify({ error: 'query parameter is required' }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Simple mode: single keyword search (used by search bar)
    if (mode === 'simple') {
      const params = new URLSearchParams({ query, page: String(page), size: String(size), sort: 'accuracy' });
      const kakaoRes = await fetch(
        `https://dapi.kakao.com/v2/local/search/keyword.json?${params}`,
        { headers: { Authorization: `KakaoAK ${KAKAO_REST_API_KEY}` } },
      );
      const data = await kakaoRes.json();
      return new Response(JSON.stringify(data), {
        status: kakaoRes.status,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Multi-keyword mode: fetch all keywords in parallel, deduplicate
    // Extract location from query (e.g. "강남 술집" -> "강남")
    const location = query.replace(/\s*술집\s*$/, '').trim() || query;

    const allResults = await Promise.all(
      BAR_KEYWORDS.map((kw) => fetchAllPagesForKeyword(KAKAO_REST_API_KEY, location, kw)),
    );

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

    const totalCount = unique.length;
    const totalPages = Math.ceil(totalCount / size);
    const start = (page - 1) * size;
    const pageItems = unique.slice(start, start + size);

    return new Response(JSON.stringify({
      documents: pageItems,
      meta: {
        total_count: totalCount,
        pageable_count: totalCount,
        is_end: page >= totalPages,
      },
      _pagination: {
        current_page: page,
        total_pages: totalPages,
        page_size: size,
      },
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
