import { useState, useRef, useCallback, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

/**
 * Debounced like hook.
 * Accumulates rapid taps and sends a single RPC-style update when tapping stops.
 */
export function useLike(kakaoPlaceId: string, initialCount: number = 0) {
  const [displayCount, setDisplayCount] = useState(initialCount);
  const pendingRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushing = useRef(false);

  // Sync initial count when it changes (e.g. data refetch)
  useEffect(() => {
    if (!flushing.current && pendingRef.current === 0) {
      setDisplayCount(initialCount);
    }
  }, [initialCount]);

  const flush = useCallback(async () => {
    const count = pendingRef.current;
    if (count === 0) return;
    pendingRef.current = 0;
    flushing.current = true;

    try {
      // Try to upsert: increment like_count by `count`
      // First check if row exists
      const { data: existing } = await supabase
        .from("bar_meta")
        .select("like_count")
        .eq("kakao_place_id", kakaoPlaceId)
        .maybeSingle();

      if (existing) {
        await supabase
          .from("bar_meta")
          .update({ like_count: existing.like_count + count })
          .eq("kakao_place_id", kakaoPlaceId);
      } else {
        await supabase
          .from("bar_meta")
          .insert({ kakao_place_id: kakaoPlaceId, like_count: count });
      }
    } catch {
      // Revert optimistic count on failure
      setDisplayCount((prev) => prev - count);
    } finally {
      flushing.current = false;
    }
  }, [kakaoPlaceId]);

  const like = useCallback(() => {
    pendingRef.current += 1;
    setDisplayCount((prev) => prev + 1);

    // Reset debounce timer
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => {
      flush();
    }, 800);
  }, [flush]);

  // Flush on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
      flush();
    };
  }, [flush]);

  return { displayCount, like };
}
