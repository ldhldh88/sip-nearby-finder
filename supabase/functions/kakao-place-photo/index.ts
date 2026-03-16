const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// In-memory cache (persists across warm invocations)
const cache = new Map<string, { photos: string[]; ts: number }>();
const CACHE_TTL = 24 * 60 * 60 * 1000; // 24h
const MAX_PHOTOS = 5;

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
        JSON.stringify({ photo_url: cached.photos[0] || null, photos: cached.photos }),
        { headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=86400" } }
      );
    }

    const photos: string[] = [];

    // Fetch Kakao place JSON API
    const placeUrl = `https://place.map.kakao.com/main/v/${placeId}`;
    const res = await fetch(placeUrl, {
      headers: {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept": "application/json",
      },
    });

    if (res.ok) {
      try {
        const data = await res.json();

        // Main photo
        const mainPhoto = data?.basicInfo?.mainphotourl;
        if (mainPhoto) photos.push(mainPhoto);

        // Photo list - extract up to MAX_PHOTOS
        const photoGroups = data?.photo?.photoList;
        if (photoGroups && Array.isArray(photoGroups)) {
          for (const group of photoGroups) {
            if (group.list && Array.isArray(group.list)) {
              for (const item of group.list) {
                const photoUrl = item.orgurl || item.url;
                if (photoUrl && !photos.includes(photoUrl) && photos.length < MAX_PHOTOS) {
                  photos.push(photoUrl);
                }
              }
            }
            if (photos.length >= MAX_PHOTOS) break;
          }
        }
      } catch {
        // JSON parse failed
      }
    }

    // Fallback: HTML og:image
    if (photos.length === 0) {
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
            photos.push(ogMatch[1]);
          }
        }
      } catch {
        // ignore
      }
    }

    // Cache result
    cache.set(placeId, { photos, ts: Date.now() });

    // Limit cache size
    if (cache.size > 5000) {
      const oldest = [...cache.entries()].sort((a, b) => a[1].ts - b[1].ts);
      for (let i = 0; i < 1000; i++) {
        cache.delete(oldest[i][0]);
      }
    }

    return new Response(
      JSON.stringify({ photo_url: photos[0] || null, photos }),
      { headers: { ...corsHeaders, "Content-Type": "application/json", "Cache-Control": "public, max-age=86400" } }
    );
  } catch (error) {
    console.error("Error fetching place photo:", error);
    return new Response(
      JSON.stringify({ photo_url: null, photos: [], error: "Failed to fetch photo" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
