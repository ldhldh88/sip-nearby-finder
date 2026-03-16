import { useState, useEffect } from "react";

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY;

// Client-side in-memory cache
const photoCache = new Map<string, { main: string | null; photos: string[] }>();
const pendingRequests = new Map<string, Promise<{ main: string | null; photos: string[] }>>();

async function fetchPlacePhotos(placeId: string): Promise<{ main: string | null; photos: string[] }> {
  if (photoCache.has(placeId)) {
    return photoCache.get(placeId)!;
  }

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
        const result = { main: null, photos: [] as string[] };
        photoCache.set(placeId, result);
        return result;
      }

      const data = await res.json();
      const result = {
        main: data.photo_url || null,
        photos: data.photos || (data.photo_url ? [data.photo_url] : []),
      };
      photoCache.set(placeId, result);
      return result;
    } catch {
      const result = { main: null, photos: [] as string[] };
      photoCache.set(placeId, result);
      return result;
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
    return photoCache.get(placeId)?.main ?? null;
  });
  const [photos, setPhotos] = useState<string[]>(() => {
    if (!placeId) return [];
    return photoCache.get(placeId)?.photos ?? [];
  });
  const [loading, setLoading] = useState(!photoCache.has(placeId ?? ""));

  useEffect(() => {
    if (!placeId) {
      setPhotoUrl(null);
      setPhotos([]);
      setLoading(false);
      return;
    }

    if (photoCache.has(placeId)) {
      const cached = photoCache.get(placeId)!;
      setPhotoUrl(cached.main);
      setPhotos(cached.photos);
      setLoading(false);
      return;
    }

    let cancelled = false;
    setLoading(true);

    fetchPlacePhotos(placeId).then((result) => {
      if (!cancelled) {
        setPhotoUrl(result.main);
        setPhotos(result.photos);
        setLoading(false);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [placeId]);

  return { photoUrl, photos, loading };
}
