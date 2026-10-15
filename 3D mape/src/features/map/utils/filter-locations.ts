import type { MapLocation } from "@/features/map/types/map-location";

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
