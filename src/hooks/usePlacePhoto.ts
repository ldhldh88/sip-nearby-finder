import { useState, useEffect } from "react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Client-side in-memory cache
const photoCache = new Map<string, string | null>();
const pendingRequests = new Map<string, Promise<string | null>>();

async function fetchPlacePhoto(placeId: string): Promise<string | null> {
  // Check cache
  if (photoCache.has(placeId)) {
    return photoCache.get(placeId)!;
  }

  // Deduplicate in-flight requests
  if (pendingRequests.has(placeId)) {
    return pendingRequests.get(placeId)!;
  }

  const promise = (async () => {
    try {
      const res = await fetch(
        `${supabaseUrl}/functions/v1/kakao-place-photo?place_id=${placeId}`,
        {
          headers: {
            Authorization: `Bearer ${anonKey}`,
            apikey: anonKey,
          },
        }
      );

      if (!res.ok) {
        photoCache.set(placeId, null);
        return null;
      }

      const data = await res.json();
      const url = data.photo_url || null;
      photoCache.set(placeId, url);
      return url;
    } catch {
      photoCache.set(placeId, null);
      return null;
    } finally {
      pendingRequests.delete(placeId);
    }
  })();

  pendingRequests.set(placeId, promise);
  return promise;
}

export function usePlacePhoto(placeId: string | undefined) {
  const [photoUrl, setPhotoUrl] = useState<string | null>(() => {
    if (!placeId) return null;
    return photoCache.get(placeId) ?? null;
  });
  const [loading, setLoading] = useState(!photoCache.has(placeId ?? ""));

  useEffect(() => {
    if (!placeId) {
      setPhotoUrl(null);
      setLoading(false);
      return;
    }

    if (photoCache.has(placeId)) {
      setPhotoUrl(photoCache.get(placeId)!);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchPlacePhoto(placeId).then((url) => {
      if (!cancelled) {
        setPhotoUrl(url);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [placeId]);

  return { photoUrl, loading };
}
