import type { MapLocation, PlaceDataSource } from "@/features/map/types/map-location";

export const OSM_COPYRIGHT_URL = "https://www.openstreetmap.org/copyright";
export const GOOGLE_MAPS_URL = "https://www.google.com/maps";

/** OpenStreetMap rows store the source in metadata; geocoder hits set it directly. */
export function placeDataSource(location: MapLocation): PlaceDataSource | null {
  if (location.dataSource) {
    return location.dataSource;
  }

  if (location.metadata?.Izvor === "OpenStreetMap") {
    return "openstreetmap";
  }

  return null;
}
