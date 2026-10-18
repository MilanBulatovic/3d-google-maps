import childrenVenues from "@/features/map/data/children-venues.json";
import mapPins from "@/features/map/data/map-pins.json";
import { parseMapLocations } from "@/features/map/utils/map-validation";

/**
 * Landmarks and children's venues.
 * Venue coordinates come from OpenStreetMap or a published street address.
 */


/** Pins drawn on the terrain. Live place search is not used for these. */
export const MAP_PINS = parseMapLocations(mapPins);


/** Saved OpenStreetMap copy. Used only when the live place request fails. */
export const LOCAL_VENUES = parseMapLocations(childrenVenues);

export const LOCATIONS = parseMapLocations([
  ...childrenVenues,
]);

export const LOCATION_CATEGORIES = [
  ...new Set(LOCATIONS.map((location) => location.category)),
];
