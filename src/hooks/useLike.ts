import { useState, useRef, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";

/**
 * Debounced like hook.
 * Accumulates rapid taps and sends a single update when tapping stops.
 */
export function useLike(kakaoPlaceId: string, initialCount: number = 0) {
  const [displayCount, setDisplayCount] = useState(initialCount);
  const pendingRef = useRef(0);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flushing = useRef(false);
  const queryClient = useQueryClient();

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
      const res = await fetch("/api/bar-meta/like", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ kakao_place_id: kakaoPlaceId, increment: count }),
      });

      if (!res.ok) throw new Error(`bar-meta/like failed: ${res.status}`);

      // Invalidate bar-meta cache so list updates
      queryClient.invalidateQueries({ queryKey: ["bar-meta"] });
    } catch {
      setDisplayCount((prev) => prev - count);
    } finally {
      flushing.current = false;
    }
  }, [kakaoPlaceId, queryClient]);

  const like = useCallback(() => {
    pendingRef.current += 1;
    setDisplayCount((prev) => prev + 1);

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
