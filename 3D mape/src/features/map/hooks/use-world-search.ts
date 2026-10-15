"use client";

import { useEffect, useState } from "react";

import { searchWorld } from "@/features/map/services/google-geocoder";
import type { MapLocation } from "@/features/map/types/map-location";
import { worldHitToLocation } from "@/features/map/utils/world-view";

const SEARCH_DELAY_MS = 400;

export type WorldSearchStatus = "idle" | "loading" | "ready" | "empty" | "error";

export function useWorldSearch(query: string, enabled: boolean, apiKey: string | null) {
  const [results, setResults] = useState<MapLocation[]>([]);
  const [status, setStatus] = useState<WorldSearchStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    if (!apiKey) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setStatus("loading");
      setResults([]);
      setMessage(null);

      searchWorld(apiKey, trimmed).then(
        (hits) => {
          if (cancelled) {
            return;
          }

          const places = hits.map(worldHitToLocation);
          setResults(places);
          setStatus(places.length > 0 ? "ready" : "empty");
          setMessage(places.length > 0 ? null : "No places match that search.");
        },
        (error: unknown) => {
          if (cancelled) {
            return;
          }

          const code =
            typeof error === "object" && error && "code" in error
              ? String(error.code)
              : error instanceof Error
                ? error.message
                : "";

          if (code.includes("ZERO_RESULTS")) {
            setResults([]);
            setStatus("empty");
            setMessage("No places match that search.");
            return;
          }

          setResults([]);
          setStatus("error");
          setMessage(
            code.includes("REQUEST_DENIED")
              ? "World search needs the Geocoding API enabled on this key."
              : error instanceof Error
                ? error.message
                : "World search failed.",
          );
        },
      );
    }, SEARCH_DELAY_MS);

    return () => {
      cancelled = true;
      window.clearTimeout(timer);
    };
  }, [apiKey, enabled, query]);

  const trimmed = query.trim();
  const idle = !enabled || trimmed.length < 2 || !apiKey;

  return {
    results: idle || !enabled ? [] : results,
    status: !enabled ? "idle" : trimmed.length < 2 ? "idle" : status,
    message: !enabled || trimmed.length < 2 ? null : message,
  };
}
