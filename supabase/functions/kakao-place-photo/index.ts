const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory cache (persists across warm invocations)
const cache = new Map<string, { url: string | null; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const url = new URL(req.url);
    const placeId = url.searchParams.get("place_id");

    if (!placeId) {
      return new Response(
        JSON.stringify({ error: "place_id is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Check cache
    const cached = cache.get(placeId);
    if (cached && Date.now() - cached.ts < CACHE_TTL) {
      return new Response(
        JSON.stringify({ photo_url: cached.url }),
        { headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=86400" } }
      );
    }

    // Fetch Kakao place page
    const placeUrl = `https://place.map.kakao.com/main/v/${placeId}`;
    const res = await fetch(placeUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    });

    let photoUrl: string | null = null;

    if (res.ok) {
      try {
        const data = await res.json();
        // Kakao place API returns JSON with photo info
        const mainPhoto = data?.basicInfo?.mainphotourl;
        if (mainPhoto) {
          photoUrl = mainPhoto;
        } else {
          // Try photoList
          const photos = data?.photo?.photoList;
          if (photos && photos.length > 0 && photos[0].list && photos[0].list.length > 0) {
            photoUrl = photos[0].list[0].orgurl || photos[0].list[0].url || null;
          }
        }
      } catch {
        // If not JSON, try HTML og:image parsing
        // This is a fallback in case the API format changes
      }
    }

    // If JSON approach failed, try the HTML page
    if (!photoUrl) {
      try {
        const htmlRes = await fetch(`https://place.map.kakao.com/${placeId}`, {
          headers: {
            "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
          },
        });
        if (htmlRes.ok) {
          const html = await htmlRes.text();
          const ogMatch = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i);
          if (ogMatch?.[1]) {
            photoUrl = ogMatch[1];
          }
        }
      } catch {
        // ignore
      }
    }

    // Cache result
    cache.set(placeId, { url: photoUrl, ts: Date.now() });

    // Limit cache size
    if (cache.size > 5000) {
      const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts);
      for (let i = 0; i < 1000; i++) {
        cache.delete(oldest[i][0]);
      }
    }

    return new Response(
      JSON.stringify({ photo_url: photoUrl }),
      { headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=86400" } }
    );
  } catch (error) {
    console.error("Error fetching place photo:", error);
    return new Response(
      JSON.stringify({ photo_url: null, error: "Failed to fetch photo" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
