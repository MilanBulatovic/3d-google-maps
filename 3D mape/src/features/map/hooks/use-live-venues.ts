"use client";

import { useEffect, useState } from "react";

import { LOCAL_VENUES } from "@/features/map/data/locations";
import type { MapLocation } from "@/features/map/types/map-location";
import { mapLocationSchema } from "@/features/map/utils/map-validation";

export type PlacesSource = "loading" | "live" | "local";

function placesFromResponse(payload: unknown): MapLocation[] {
  if (!payload || typeof payload !== "object" || !("places" in payload)) {
    return [];
  }

  if (!Array.isArray(payload.places)) {
    return [];
  }

  return payload.places.flatMap((place) => {
    const parsed = mapLocationSchema.safeParse(place);
    return parsed.success ? [parsed.data] : [];
  });
}

/** Live OpenStreetMap places. The saved list is used only when that request fails. */
export function useLiveVenues() {
  const [places, setPlaces] = useState<readonly MapLocation[]>([]);
  const [source, setSource] = useState<PlacesSource>("loading");

  useEffect(() => {
    const controller = new AbortController();

    fetch("/api/places", { signal: controller.signal })
      .then(async (response) => {
        if (!response.ok) {
          throw new Error("Live places are unavailable.");
        }

        const payload: unknown = await response.json();
        const nextPlaces = placesFromResponse(payload);
        if (nextPlaces.length === 0) {
          throw new Error("Live places are empty.");
        }

        const saved =
          payload !== null &&
          typeof payload === "object" &&
          "source" in payload &&
          payload.source === "local";
        setPlaces(nextPlaces);
        setSource(saved ? "local" : "live");
      })
      .catch((error: unknown) => {
        if (controller.signal.aborted || (error instanceof DOMException && error.name === "AbortError")) {
          return;
        }

        setPlaces(LOCAL_VENUES);
        setSource("local");
      });

    return () => {
      controller.abort();
    };
  }, []);

  return { places, source };
}
