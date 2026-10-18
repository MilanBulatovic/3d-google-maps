"use client";

import { useEffect, useState } from "react";

import {
  loadGoogleMaps3d,
  type Maps3dRuntime,
} from "@/features/map/services/google-maps-loader";

export function useGoogleMaps3d(apiKey: string) {
  const [runtime, setRuntime] = useState<Maps3dRuntime | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    loadGoogleMaps3d(apiKey).then(
      (loaded) => {
        if (!cancelled) {
          setRuntime(loaded);
        }
      },
      (caught: unknown) => {
        if (!cancelled) {
          setError(
            caught instanceof Error
              ? caught.message
              : "The Google Maps JavaScript API could not be loaded.",
          );
        }
      },
    );

    return () => {
      cancelled = true;
    };
  }, [apiKey]);

  return { runtime, error };
}
