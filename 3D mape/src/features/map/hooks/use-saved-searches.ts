"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import type { MapLocation } from "@/features/map/types/map-location";
import {
  readSavedSearches,
  rememberSavedSearch,
  writeSavedSearches,
} from "@/features/map/utils/saved-searches";

export function useSavedSearches() {
  const [places, setPlaces] = useState<MapLocation[]>([]);
  const hydrated = useRef(false);

  useEffect(() => {
    setPlaces(readSavedSearches(window.localStorage));
    hydrated.current = true;
  }, []);

  const remember = useCallback((place: MapLocation) => {
    setPlaces((current) => {
      const base = hydrated.current ? current : readSavedSearches(window.localStorage);
      const next = rememberSavedSearch(base, place);
      if (next !== base) {
        writeSavedSearches(window.localStorage, next);
      }
      hydrated.current = true;
      return next;
    });
  }, []);

  return { places, remember };
}
