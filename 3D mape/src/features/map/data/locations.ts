import childrenVenues from "@/features/map/data/children-venues.json";
import mapPins from "@/features/map/data/map-pins.json";
import { parseMapLocations } from "@/features/map/utils/map-validation";

/**
 * Landmarks and children's venues.
 * Venue coordinates come from OpenStreetMap or a published street address.
 */
const locationInput = [
  {
    id: "millennium-bridge",
    name: "Millennium Bridge",
    category: "Landmark",
    description:
      "Cable-stayed bridge over the Morača, opened in 2005, with a 57 m pylon and a 140 m main span.",
    latitude: 42.445131,
    longitude: 19.258355,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/en/0/00/Podgorica-Millennium-Bridge-2018.jpg",
    imageCredit: {
      author: "Bjørn Christian Tørrissen",
      authorUrl: "https://commons.wikimedia.org/wiki/User:Uspn",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    address: "13. jula, Podgorica",
    tags: ["bridge", "moraca", "most milenijum"],
    metadata: { opened: 2005, lengthMeters: 173 },
  },
  {
    id: "sahat-kula",
    name: "Sahat Kula",
    category: "Heritage",
    description:
      "Ottoman clock tower from 1667 in Stara Varoš, one of the few historic landmarks that survived the Second World War.",
    latitude: 42.435597,
    longitude: 19.260069,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/6/64/Natural_History_Museum_of_Montenegro,_Sahat_Kula,_2019_(1).jpg",
    imageCredit: {
      author: "Liridon",
      authorUrl: "https://commons.wikimedia.org/wiki/User:Liridon",
      license: "CC BY-SA 4.0",
      licenseUrl: "https://creativecommons.org/licenses/by-sa/4.0/",
    },
    address: "Trg Vojvode Bećir-bega Osmanagića, Stara varoš",
    tags: ["clock tower", "ottoman", "stara varos", "old town"],
    metadata: { completed: 1667, heightMeters: 19 },
  },
  {
    id: "cathedral-of-the-resurrection",
    name: "Cathedral of the Resurrection",
    category: "Worship",
    description:
      "Serbian Orthodox cathedral on Bulevar Džordža Vašingtona, completed in 2013 and crowned by a large central dome.",
    latitude: 42.445713,
    longitude: 19.248243,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/en/1/11/Podgorica,_cattedrale_della_resurrezione_di_cristo,_esterno_01.JPG",
    imageCredit: {
      author: "Sailko",
      authorUrl: "https://commons.wikimedia.org/wiki/User:Sailko",
      license: "CC BY 3.0",
      licenseUrl: "https://creativecommons.org/licenses/by/3.0/",
    },
    address: "Bulevar Džordža Vašingtona, Podgorica",
    tags: ["cathedral", "church", "hram", "orthodox"],
    metadata: { completed: 2013 },
  },
  {
    id: "stadion-pod-goricom",
    name: "Stadion pod Goricom",
    category: "Sport",
    description:
      "Podgorica City Stadium, north of the centre, home of FK Budućnost and a regular ground for the Montenegro national team.",
    latitude: 42.444839,
    longitude: 19.264288,
    imageUrl:
      "https://upload.wikimedia.org/wikipedia/commons/8/82/Stadion_pod_Goricom.jpg",
    imageCredit: {
      author: "MrSco",
      authorUrl: "https://www.flickr.com/people/95232643@N00",
      license: "CC BY 2.0",
      licenseUrl: "https://creativecommons.org/licenses/by/2.0",
    },
    address: "19. Decembra, Podgorica",
    tags: ["stadium", "football", "buducnost", "sport"],
  },
  {
    id: "king-nikola-palace",
    name: "King Nikola's Palace",
    category: "Culture",
    description:
      "Petrović palace in Kruševac, built for King Nikola and now used as a museum inside a small formal garden.",
    latitude: 42.437975,
    longitude: 19.250257,
    address: "Džona Džeksona, Kruševac, Podgorica",
    tags: ["palace", "museum", "petrovic", "dvorac"],
    metadata: { use: "Museum" },
  },
  {
    id: "big-fashion",
    name: "BIG Fashion",
    category: "Shopping",
    description:
      "Large shopping centre on the west side of the city, formerly known as Delta City, with shops and a cinema.",
    latitude: 42.437182,
    longitude: 19.235813,
    address: "Bulevar knjaza Danila Petrovića, Podgorica",
    tags: ["mall", "delta city", "shopping", "big fashion"],
  },
  {
    id: "skaline",
    name: "Skaline",
    category: "Heritage",
    description:
      "Stone steps of the old town where the Ribnica meets the Morača, beside the remains of the Ottoman quarter.",
    latitude: 42.439679,
    longitude: 19.258461,
    address: "Stara varoš, Podgorica",
    tags: ["stairs", "ribnica", "old town", "confluence"],
  },
  {
    id: "gorica-park",
    name: "Gorica Forest Park",
    category: "Nature",
    description:
      "Wooded hill the city is named for. This view sits at the city-side entrance, where trails climb toward St George's church.",
    latitude: 42.445751,
    longitude: 19.266635,
    address: "19. Decembra, Park šuma Gorica",
    tags: ["park", "hill", "forest", "nature"],
  },
  {
    id: "vila-moraca",
    name: "Vila na Morači",
    category: "Residence",
    description:
      "Sample riverside residence used to open the property gallery. The photographs are local placeholders, not a live listing.",
    latitude: 42.4432,
    longitude: 19.2548,
    imageUrl: "/properties/vila-moraca-living.png",
    address: "Kralja Nikole, Podgorica",
    tags: ["residence", "vila", "moraca", "property"],
  },
  {
    id: "stan-preko-morace",
    name: "Stan na Preko Morači",
    category: "Residence",
    description:
      "Sample apartment east of the Morača used to open the property gallery. The photographs are local placeholders, not a live listing.",
    latitude: 42.4476,
    longitude: 19.2702,
    imageUrl: "/properties/stan-preko-living.png",
    address: "Preko Morače, Podgorica",
    tags: ["residence", "apartment", "stan", "property"],
  },
  {
    id: "kuca-stara-varos",
    name: "Kuća u Staroj varoši",
    category: "Residence",
    description:
      "Sample house in the old town used to open the property gallery. The photographs are local placeholders, not a live listing.",
    latitude: 42.4342,
    longitude: 19.2634,
    imageUrl: "/properties/kuca-varos-living.png",
    address: "Stara varoš, Podgorica",
    tags: ["residence", "house", "stara varos", "property"],
  },
];

/** Pins drawn on the terrain. Live place search is not used for these. */
export const MAP_PINS = parseMapLocations(mapPins);

export const CURATED_LOCATIONS = parseMapLocations(locationInput);

/** Saved OpenStreetMap copy. Used only when the live place request fails. */
export const LOCAL_VENUES = parseMapLocations(childrenVenues);

export const LOCATIONS = parseMapLocations([
  ...locationInput,
  ...childrenVenues,
]);

export const LOCATION_CATEGORIES = [
  ...new Set(LOCATIONS.map((location) => location.category)),
];
