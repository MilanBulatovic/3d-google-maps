import childrenVenues from "@/features/map/data/children-venues.json";
import mapPins from "@/features/map/data/map-pins.json";
import { parseMapLocations } from "@/features/map/utils/map-validation";

/**
 * Landmarks and children's venues.
 * Venue coordinates come from OpenStreetMap or a published street address.
 */


/**
 * Pins drawn on the terrain. Live place search is not used for these.
 * Isključeno sa mape (nije One poslovnica ni zgrada):
 *
 * {
 *   "id": "most-milenijum",
 *   "name": "Most Milenijum",
 *   "category": "Lokacija",
 *   "description": "Lazni pin na mostu preko Morače. Nema ulazak u zgradu.",
 *   "latitude": 42.445131,
 *   "longitude": 19.258355,
 *   "address": "13. jula, Podgorica",
 *   "pinStyle": "plain"
 * },
 * {
 *   "id": "park-petrovic",
 *   "name": "Park Petrović",
 *   "category": "Lokacija",
 *   "description": "Lazni pin u parku na zapadnoj strani centra.",
 *   "latitude": 42.4375,
 *   "longitude": 19.2475,
 *   "address": "Park Petrović, Podgorica",
 *   "pinStyle": "plain"
 * }
 */
export const MAP_PINS = parseMapLocations(mapPins);


/** Saved OpenStreetMap copy. Used only when the live place request fails. */
export const LOCAL_VENUES = parseMapLocations(childrenVenues);

export const LOCATIONS = parseMapLocations([
  ...childrenVenues,
]);

export const LOCATION_CATEGORIES = [
  ...new Set(LOCATIONS.map((location) => location.category)),
];
