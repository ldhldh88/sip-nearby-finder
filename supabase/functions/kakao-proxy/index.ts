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
    const query = url.searchParams.get('query');
    const page = url.searchParams.get('page') || '1';
    const size = url.searchParams.get('size') || '15';
    const sort = url.searchParams.get('sort') || 'accuracy';
    const mode = url.searchParams.get('mode') || 'keyword'; // 'keyword' or 'category'
    const x = url.searchParams.get('x');
    const y = url.searchParams.get('y');
    const radius = url.searchParams.get('radius');
    const categoryGroupCode = url.searchParams.get('category_group_code');
    const rect = url.searchParams.get('rect');

    const KAKAO_REST_API_KEY = Deno.env.get('KAKAO_REST_API_KEY');
    if (!KAKAO_REST_API_KEY) {
      return new Response(JSON.stringify({ error: 'KAKAO_REST_API_KEY not configured' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    let kakaoUrl: string;
    const params = new URLSearchParams({ page, size, sort });

    if (mode === 'category') {
      // Category search by coordinates
      if (categoryGroupCode) params.set('category_group_code', categoryGroupCode);
      if (x) params.set('x', x);
      if (y) params.set('y', y);
      if (radius) params.set('radius', radius);
      if (rect) params.set('rect', rect);
      if (query) params.set('query', query);
      kakaoUrl = `https://dapi.kakao.com/v2/local/search/category.json?${params}`;
    } else {
      // Keyword search (default)
      if (!query) {
        return new Response(JSON.stringify({ error: 'query parameter is required' }), {
          status: 400,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        });
      }
      params.set('query', query);
      kakaoUrl = `https://dapi.kakao.com/v2/local/search/keyword.json?${params}`;
    }

    const kakaoRes = await fetch(kakaoUrl, {
      headers: {
        Authorization: `KakaoAK ${KAKAO_REST_API_KEY}`,
      },
    });

    const data = await kakaoRes.json();

    return new Response(JSON.stringify(data), {
      status: kakaoRes.status,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
