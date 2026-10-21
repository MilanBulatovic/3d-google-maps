import type { MapLocation } from "@/features/map/types/map-location";
import { mergeMapPins } from "@/features/map/utils/saved-searches";

export type LocationFilter = {
  query: string;
  category: string;
};

const PLAY_CATEGORIES = new Set([
  "Vrtić",
  "Rođendaonica",
  "Igralište",
  "Dječija radionica",
]);

const EMERGENCY_CATEGORIES = new Set([
  "Policija",
  "Vatrogasci",
  "Hitna pomoć",
  "Bolnica",
  "Gorska služba",
  "Spasilačka služba",
]);

function fold(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("đ", "dj")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

export function filterLocations(
  locations: readonly MapLocation[],
  filter: LocationFilter,
): MapLocation[] {
  const query = fold(filter.query.trim());
  const category = filter.category;

  return locations.filter((location) => {
    const matchesCategory =
      category === "all" ||
      location.category === category ||
      (category === "Igraonice" && PLAY_CATEGORIES.has(location.category)) ||
      (category === "Hitne službe" && EMERGENCY_CATEGORIES.has(location.category));
    if (!matchesCategory) {
      return false;
    }

    if (!query) {
      return true;
    }

    const haystack = fold(
      [
        location.name,
        location.category,
        location.description,
        ...(location.tags ?? []),
      ].join(" "),
    );

    return haystack.includes(query);
  });
}

/** Custom file pins stay on the map, plus catalog places in the selected category. */
export function visibleMapPlaces(
  filePins: readonly MapLocation[],
  catalog: readonly MapLocation[],
  category: string,
): MapLocation[] {
  return mergeMapPins(filePins, filterLocations(catalog, { query: "", category }));
}

/** Search matches the category catalog first, then custom file pins by name. */
export function searchPlaces(
  filePins: readonly MapLocation[],
  catalog: readonly MapLocation[],
  filter: LocationFilter,
): MapLocation[] {
  return mergeMapPins(
    filterLocations(catalog, filter),
    filterLocations(filePins, { query: filter.query, category: "all" }),
  );
}
