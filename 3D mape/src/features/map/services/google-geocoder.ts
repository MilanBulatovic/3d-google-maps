import { importLibrary } from "@googlemaps/js-api-loader";

import { loadGoogleMaps3d, MAP_LANGUAGE } from "@/features/map/services/google-maps-loader";
import type { WorldHit } from "@/features/map/utils/world-view";

const RESULT_LIMIT = 5;

function placeName(result: google.maps.GeocoderResult): string {
  const preferred = result.address_components.find((component) =>
    component.types.some((type) =>
      ["locality", "administrative_area_level_1", "country", "point_of_interest"].includes(
        type,
      ),
    ),
  );

  return preferred?.long_name ?? result.formatted_address.split(",")[0] ?? result.formatted_address;
}

function toHit(result: google.maps.GeocoderResult): WorldHit | null {
  const bounds = result.geometry.bounds ?? result.geometry.viewport;
  const location = result.geometry.location;
  if (!bounds || !location) {
    return null;
  }

  const northeast = bounds.getNorthEast();
  const southwest = bounds.getSouthWest();

  return {
    placeId: result.place_id,
    name: placeName(result),
    formattedAddress: result.formatted_address,
    latitude: location.lat(),
    longitude: location.lng(),
    north: northeast.lat(),
    south: southwest.lat(),
    east: northeast.lng(),
    west: southwest.lng(),
    types: result.types,
  };
}

async function geocode(
  apiKey: string,
  query: string,
  country?: string,
): Promise<WorldHit[]> {
  await loadGoogleMaps3d(apiKey);
  const { Geocoder } = await importLibrary("geocoding");
  const geocoder = new Geocoder();
  const response = await geocoder.geocode({
    address: query,
    language: MAP_LANGUAGE,
    ...(country
      ? { componentRestrictions: { country }, region: country.toLowerCase() }
      : {}),
  });

  return response.results.slice(0, RESULT_LIMIT).flatMap((result) => {
    const hit = toHit(result);
    return hit ? [hit] : [];
  });
}

/** Forward-geocodes a free-text query. Requires the Geocoding API on the same key. */
export function searchWorld(apiKey: string, query: string): Promise<WorldHit[]> {
  return geocode(apiKey, query);
}

/** Addresses, cities, and place names restricted to Montenegro. */
export function searchMontenegroGeocode(
  apiKey: string,
  query: string,
): Promise<WorldHit[]> {
  return geocode(apiKey, query, "ME");
}
