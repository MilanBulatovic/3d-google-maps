import type { MapLocation } from "@/features/map/types/map-location";

export type LocationFilter = {
  query: string;
  category: string;
};

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
    if (category !== "all" && location.category !== category) {
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
