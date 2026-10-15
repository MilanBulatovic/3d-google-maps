"use client";

import { useMemo } from "react";

import { CURATED_LOCATIONS } from "@/features/map/data/locations";
import {
  useLiveVenues,
  type PlacesSource,
} from "@/features/map/hooks/use-live-venues";
import { filterLocations } from "@/features/map/utils/filter-locations";

export function useMapLocations(query: string, category: string) {
  const venues = useLiveVenues();
  const locations = useMemo(
    () => [...CURATED_LOCATIONS, ...venues.places],
    [venues.places],
  );
  const categories = useMemo(
    () => [...new Set(locations.map((location) => location.category))],
    [locations],
  );

  return {
    locations,
    categories,
    filtered: filterLocations(locations, { query, category }),
    placesSource: venues.source satisfies PlacesSource,
  };
}
