"use client";

import { useEffect, useState } from "react";

import { suggestMontenegro } from "@/features/map/services/montenegro-search";
import type { MapLocation } from "@/features/map/types/map-location";

const SEARCH_DELAY_MS = 250;

export type MontenegroSearchStatus = "idle" | "loading" | "ready" | "empty" | "error";

export function useMontenegroSearch(
  query: string,
  enabled: boolean,
  apiKey: string | null,
) {
  const [results, setResults] = useState<MapLocation[]>([]);
  const [status, setStatus] = useState<MontenegroSearchStatus>("idle");
  const [message, setMessage] = useState<string | null>(null);

  useEffect(() => {
    if (!enabled || !apiKey) {
      return;
    }

    const trimmed = query.trim();
    if (trimmed.length < 2) {
      return;
    }

    let cancelled = false;
    const timer = window.setTimeout(() => {
      setStatus("loading");
      setMessage(null);

      suggestMontenegro(apiKey, trimmed).then(
        (places) => {
          if (cancelled) {
            return;
          }

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

          setResults([]);
          if (code.includes("ZERO_RESULTS")) {
            setStatus("empty");
            setMessage("No places match that search.");
            return;
          }

          setStatus("error");
          setMessage(
            code.includes("REQUEST_DENIED")
              ? "Montenegro search needs the Places API or Geocoding API enabled on this key."
              : error instanceof Error
                ? error.message
                : "Montenegro search failed.",
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
    results: idle ? [] : results,
    status: !enabled || trimmed.length < 2 ? "idle" : status,
    message: !enabled || trimmed.length < 2 ? null : message,
  };
}
