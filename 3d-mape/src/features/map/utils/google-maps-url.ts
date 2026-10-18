import { isValidCoordinate } from "@/features/map/utils/map-validation";

const SEARCH_URL = "https://www.google.com/maps/search/";
const DIRECTIONS_URL = "https://www.google.com/maps/dir/";

function coordinateQuery(latitude: number, longitude: number): string | null {
  if (!isValidCoordinate(latitude, longitude)) {
    return null;
  }

  return `${latitude},${longitude}`;
}

/** Maps URLs search link that drops a pin on the coordinates. */
export function buildMapsSearchUrl(
  latitude: number,
  longitude: number,
): string | null {
  const query = coordinateQuery(latitude, longitude);

  if (!query) {
    return null;
  }

  const params = new URLSearchParams({
    api: "1",
    query,
  });

  return `${SEARCH_URL}?${params.toString()}`;
}

/** Maps URLs directions link with the place as the destination. */
export function buildMapsDirectionsUrl(
  latitude: number,
  longitude: number,
): string | null {
  const destination = coordinateQuery(latitude, longitude);

  if (!destination) {
    return null;
  }

  const params = new URLSearchParams({
    api: "1",
    destination,
  });

  return `${DIRECTIONS_URL}?${params.toString()}`;
}
