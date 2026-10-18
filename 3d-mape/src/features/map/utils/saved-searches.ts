import type { MapLocation } from "@/features/map/types/map-location";
import { mapLocationSchema } from "@/features/map/utils/map-validation";

export const SAVED_SEARCHES_KEY = "cg-3d-map.saved-searches";
const MAX_SAVED_SEARCHES = 40;

function isPlaced(location: MapLocation): boolean {
  return location.latitude !== 0 || location.longitude !== 0;
}

export function readSavedSearches(storage: Pick<Storage, "getItem">): MapLocation[] {
  try {
    const raw = storage.getItem(SAVED_SEARCHES_KEY);
    if (!raw) {
      return [];
    }

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.flatMap((item) => {
      const result = mapLocationSchema.safeParse(item);
      return result.success && isPlaced(result.data) ? [result.data] : [];
    });
  } catch {
    return [];
  }
}

export function rememberSavedSearch(
  current: readonly MapLocation[],
  place: MapLocation,
): MapLocation[] {
  if (!isPlaced(place)) {
    return current as MapLocation[];
  }

  const without = current.filter((item) => item.id !== place.id);
  return [...without, place].slice(-MAX_SAVED_SEARCHES);
}

export function writeSavedSearches(
  storage: Pick<Storage, "setItem">,
  places: readonly MapLocation[],
): void {
  try {
    storage.setItem(SAVED_SEARCHES_KEY, JSON.stringify(places));
  } catch {
    // Quota or private mode: pins still show for this visit.
  }
}

export function mergeMapPins(
  globalPins: readonly MapLocation[],
  savedSearches: readonly MapLocation[],
): MapLocation[] {
  const globalIds = new Set(globalPins.map((pin) => pin.id));
  return [
    ...globalPins,
    ...savedSearches.filter((place) => !globalIds.has(place.id)),
  ];
}
