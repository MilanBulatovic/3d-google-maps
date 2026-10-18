import { importLibrary } from "@googlemaps/js-api-loader";

import { searchMontenegroGeocode } from "@/features/map/services/google-geocoder";
import { loadGoogleMaps3d, MAP_LANGUAGE } from "@/features/map/services/google-maps-loader";
import type { MapLocation } from "@/features/map/types/map-location";
import { worldHitToLocation, type WorldHit } from "@/features/map/utils/world-view";

const SUGGESTION_LIMIT = 8;

const predictions = new Map<string, google.maps.places.PlacePrediction>();
let sessionToken: google.maps.places.AutocompleteSessionToken | null = null;

export function montenegroCategory(types: readonly string[]): string {
  if (
    types.some((type) =>
      [
        "locality",
        "postal_town",
        "administrative_area_level_1",
        "administrative_area_level_2",
      ].includes(type),
    )
  ) {
    return "Grad";
  }

  if (
    types.some((type) =>
      ["street_address", "route", "premise", "subpremise", "plus_code"].includes(type),
    )
  ) {
    return "Adresa";
  }

  return "Mjesto";
}

function suggestionId(placeId: string): string {
  return `me-${placeId}`;
}

function unresolved(prediction: google.maps.places.PlacePrediction): MapLocation {
  const name = prediction.mainText?.text || prediction.text.text;
  const address = prediction.secondaryText?.text;

  return {
    id: suggestionId(prediction.placeId),
    name,
    category: montenegroCategory(prediction.types),
    description: address || name,
    latitude: 0,
    longitude: 0,
    address,
    dataSource: "google",
  };
}

function locatedHit(hit: WorldHit): MapLocation {
  return { ...worldHitToLocation(hit), category: "Adresa" };
}

function boundsFor(
  place: google.maps.places.Place,
  latitude: number,
  longitude: number,
): Pick<WorldHit, "north" | "south" | "east" | "west"> {
  const viewport = place.viewport;
  if (viewport) {
    const northeast = viewport.getNorthEast();
    const southwest = viewport.getSouthWest();
    return {
      north: northeast.lat(),
      south: southwest.lat(),
      east: northeast.lng(),
      west: southwest.lng(),
    };
  }

  const pad = 0.002;
  return {
    north: latitude + pad,
    south: latitude - pad,
    east: longitude + pad,
    west: longitude - pad,
  };
}

async function suggestWithPlaces(query: string): Promise<MapLocation[]> {
  const { AutocompleteSuggestion, AutocompleteSessionToken } = await importLibrary("places");
  sessionToken ??= new AutocompleteSessionToken();
  const { suggestions } = await AutocompleteSuggestion.fetchAutocompleteSuggestions({
    input: query,
    includedRegionCodes: ["me"],
    language: MAP_LANGUAGE,
    region: "me",
    sessionToken,
  });

  return suggestions.slice(0, SUGGESTION_LIMIT).flatMap((suggestion) => {
    const prediction = suggestion.placePrediction;
    if (!prediction) {
      return [];
    }

    const location = unresolved(prediction);
    predictions.set(location.id, prediction);
    return [location];
  });
}

function placesUnavailable(error: unknown): boolean {
  const message = error instanceof Error ? error.message : String(error);
  return /places|REQUEST_DENIED|ApiNotActivated|not enabled/i.test(message);
}

/** Google suggestions for cities, places, and addresses inside Montenegro. */
export async function suggestMontenegro(
  apiKey: string,
  query: string,
): Promise<MapLocation[]> {
  await loadGoogleMaps3d(apiKey);

  try {
    const suggestions = await suggestWithPlaces(query);
    if (suggestions.length > 0) {
      return suggestions;
    }
  } catch (error) {
    if (!placesUnavailable(error)) {
      throw error;
    }
  }

  const hits = await searchMontenegroGeocode(apiKey, query);
  return hits.map(locatedHit);
}

export function needsPlaceDetails(location: MapLocation): boolean {
  return location.latitude === 0 && location.longitude === 0;
}

/** Turns a chosen suggestion into a fly-to location. */
export async function resolveMontenegroHit(
  apiKey: string,
  hit: MapLocation,
): Promise<MapLocation> {
  if (!needsPlaceDetails(hit)) {
    return hit;
  }

  const prediction = predictions.get(hit.id);
  if (prediction) {
    const place = prediction.toPlace();
    await place.fetchFields({
      fields: ["displayName", "formattedAddress", "location", "viewport"],
    });
    sessionToken = null;
    const position = place.location;
    if (position) {
      const latitude = position.lat();
      const longitude = position.lng();
      const address = place.formattedAddress ?? hit.address ?? hit.name;
      return {
        ...worldHitToLocation({
          placeId: place.id || prediction.placeId,
          name: place.displayName || hit.name,
          formattedAddress: address,
          latitude,
          longitude,
          ...boundsFor(place, latitude, longitude),
        }),
        category: hit.category,
      };
    }
  }

  const hits = await searchMontenegroGeocode(apiKey, hit.address ?? hit.name);
  const located = hits[0];
  if (!located) {
    throw new Error("That place has no map location in Montenegro.");
  }

  return locatedHit(located);
}
