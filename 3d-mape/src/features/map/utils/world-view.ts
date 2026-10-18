import { BIRDS_EYE_CAMERA } from "@/features/map/config/camera";
import type { MapLocation } from "@/features/map/types/map-location";

const METERS_PER_DEGREE = 111_000;

const REGION_TYPES = new Set(["country", "administrative_area_level_1"]);

export type WorldHit = {
  placeId: string;
  name: string;
  formattedAddress: string;
  latitude: number;
  longitude: number;
  north: number;
  south: number;
  east: number;
  west: number;
  types?: readonly string[];
};

/** Camera distance that frames a geocoder viewport, in meters. */
export function rangeFromSpan(
  north: number,
  south: number,
  east: number,
  west: number,
  latitude: number,
): number {
  const latMeters = Math.abs(north - south) * METERS_PER_DEGREE;
  const lngScale = Math.cos((latitude * Math.PI) / 180);
  const lngMeters = Math.abs(east - west) * METERS_PER_DEGREE * Math.abs(lngScale);
  const span = Math.max(latMeters, lngMeters, 400);
  return Math.min(span * 1.2, 4_000_000);
}

export function tiltForRange(range: number): number {
  if (range >= 20_000) {
    return 62;
  }

  if (range >= 2_500) {
    return 48;
  }

  return BIRDS_EYE_CAMERA.tilt;
}

function isRegion(types: readonly string[] | undefined): boolean {
  return types?.some((type) => REGION_TYPES.has(type)) ?? false;
}

export function worldHitToLocation(hit: WorldHit): MapLocation {
  const location: MapLocation = {
    id: `world-${hit.placeId}`,
    name: hit.name,
    category: "Svijet",
    description: hit.formattedAddress,
    latitude: hit.latitude,
    longitude: hit.longitude,
    address: hit.formattedAddress,
    dataSource: "google",
    tags: ["world", hit.formattedAddress],
  };

  if (!isRegion(hit.types)) {
    return location;
  }

  const viewRange = rangeFromSpan(
    hit.north,
    hit.south,
    hit.east,
    hit.west,
    hit.latitude,
  );

  return {
    ...location,
    viewRange,
    viewTilt: tiltForRange(viewRange),
  };
}
