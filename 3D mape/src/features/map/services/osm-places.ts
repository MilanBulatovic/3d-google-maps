import { isInMontenegro } from "@/features/map/data/montenegro-outline";
import type { MapLocation } from "@/features/map/types/map-location";
import { mapLocationSchema } from "@/features/map/utils/map-validation";

const IMAGE_HOSTS = new Set([
  "upload.wikimedia.org",
  "commons.wikimedia.org",
]);

/** South, west, north, east. Area lookups currently return no Montenegro area on public Overpass servers. */
const MONTENEGRO_BBOX = "41.85,18.43,43.56,20.36";

/**
 * Separate indexed tag queries. One combined query, especially a country-wide name regex,
 * makes Overpass time out and return an empty list.
 */
export const OVERPASS_PLACE_SELECTORS = [
  `nwr["amenity"="kindergarten"](${MONTENEGRO_BBOX})`,
  `nwr["amenity"="childcare"](${MONTENEGRO_BBOX})`,
  `nwr["leisure"="indoor_play"](${MONTENEGRO_BBOX})`,
  `nwr["leisure"="playground"](${MONTENEGRO_BBOX})`,
  `nwr["office"="estate_agent"](${MONTENEGRO_BBOX})`,
  `nwr["shop"="estate_agent"](${MONTENEGRO_BBOX})`,
  `nwr["amenity"="police"](${MONTENEGRO_BBOX})`,
  `nwr["amenity"="fire_station"](${MONTENEGRO_BBOX})`,
  `nwr["amenity"="hospital"](${MONTENEGRO_BBOX})`,
  `nwr["healthcare"="hospital"](${MONTENEGRO_BBOX})`,
  `nwr["emergency"="ambulance_station"](${MONTENEGRO_BBOX})`,
  `nwr["emergency"="mountain_rescue"](${MONTENEGRO_BBOX})`,
  `nwr["emergency"="water_rescue"](${MONTENEGRO_BBOX})`,
  `nwr["emergency"="disaster_help_point"](${MONTENEGRO_BBOX})`,
] as const;

export function overpassQuery(selector: string): string {
  return `[out:json][timeout:20];${selector};out center tags;`;
}

type OverpassElement = {
  type?: string;
  id?: number;
  lat?: number;
  lon?: number;
  center?: { lat?: number; lon?: number };
  tags?: Record<string, string>;
};

function fold(value: string): string {
  return value
    .toLowerCase()
    .replaceAll("đ", "dj")
    .normalize("NFD")
    .replace(/\p{M}/gu, "");
}

function hiddenPlace(name: string): boolean {
  const folded = fold(name);
  return folded.includes("sukobin") || folded.includes("katerkol");
}

function categoryFor(tags: Record<string, string>): string | null {
  if (tags.amenity === "police") {
    return "Policija";
  }

  if (tags.amenity === "fire_station") {
    return "Vatrogasci";
  }

  if (tags.emergency === "ambulance_station") {
    return "Hitna pomoć";
  }

  if (tags.amenity === "hospital" || tags.healthcare === "hospital") {
    return "Bolnica";
  }

  if (tags.emergency === "mountain_rescue") {
    return "Gorska služba";
  }

  if (tags.emergency === "water_rescue" || tags.emergency === "disaster_help_point") {
    return "Spasilačka služba";
  }

  if (tags.office === "estate_agent" || tags.shop === "estate_agent") {
    return "Nekretnine";
  }

  const amenity = tags.amenity;
  if (amenity === "kindergarten" || amenity === "childcare") {
    return "Vrtić";
  }

  const name = fold(tags.name ?? "");
  if (name.includes("radionic")) {
    return "Dječija radionica";
  }

  if (
    tags.leisure === "indoor_play" ||
    /rodjendaon|igraonic|playroom|birthday/.test(name)
  ) {
    return "Rođendaonica";
  }

  if (tags.leisure === "playground") {
    return "Igralište";
  }

  return null;
}

function allowedImage(value: string | undefined): string | undefined {
  if (!value) {
    return undefined;
  }

  const trimmed = value.trim();
  if (!URL.canParse(trimmed)) {
    return undefined;
  }

  const url = new URL(trimmed);
  if (url.protocol !== "https:" || !IMAGE_HOSTS.has(url.hostname)) {
    return undefined;
  }

  return url.toString();
}

function commonsImage(tags: Record<string, string>): string | undefined {
  const raw = tags.wikimedia_commons ?? tags["wikimedia_commons:0"];
  if (!raw) {
    return undefined;
  }

  const file = raw
    .replace(/^https?:\/\/commons\.wikimedia\.org\/wiki\//i, "")
    .replace(/^File:/i, "")
    .trim()
    .replaceAll(" ", "_");

  if (!file) {
    return undefined;
  }

  return `https://commons.wikimedia.org/wiki/Special:FilePath/${encodeURIComponent(file)}`;
}

function imageFor(tags: Record<string, string>): string | undefined {
  return (
    allowedImage(tags.image) ??
    allowedImage(tags["image:0"]) ??
    commonsImage(tags)
  );
}

function addressFor(tags: Record<string, string>): string | undefined {
  const street = [tags["addr:street"], tags["addr:housenumber"]]
    .filter(Boolean)
    .join(" ");
  const address = [street, tags["addr:city"]].filter(Boolean).join(", ");
  return address || undefined;
}

function descriptionFor(
  name: string,
  category: string,
  operator: string | undefined,
): string {
  const kinds: Record<string, string> = {
    Vrtić: "vrtić",
    Rođendaonica: "rođendaonica",
    Igralište: "igralište",
    Nekretnine: "agencija za nekretnine",
    Policija: "policijska stanica",
    Vatrogasci: "vatrogasna stanica",
    "Hitna pomoć": "stanica hitne pomoći",
    Bolnica: "bolnica",
    "Gorska služba": "stanica gorske službe",
    "Spasilačka služba": "spasilačka stanica",
  };
  const kind = kinds[category] ?? "dječija radionica";
  const sentence = `${name} je ${kind} u Crnoj Gori.`;
  return operator ? `${sentence} Ustanovu vodi ${operator}.` : sentence;
}

function placeFromElement(element: OverpassElement): MapLocation | null {
  const tags = element.tags;
  const name = tags?.name?.trim();
  const type = element.type;
  const id = element.id;
  if (
    !tags ||
    !name ||
    hiddenPlace(name) ||
    (type !== "node" && type !== "way" && type !== "relation") ||
    id == null
  ) {
    return null;
  }

  const latitude = element.lat ?? element.center?.lat;
  const longitude = element.lon ?? element.center?.lon;
  const category = categoryFor(tags);
  const country = `${tags["addr:country"] ?? ""} ${tags["is_in:country"] ?? ""}`.toLowerCase();
  const markedAlbania = /\bal\b|albania|shqip/.test(country);
  if (
    latitude == null ||
    longitude == null ||
    !category ||
    markedAlbania ||
    !isInMontenegro(latitude, longitude)
  ) {
    return null;
  }

  const operator = tags.operator?.trim();
  const parsed = mapLocationSchema.safeParse({
    id: `osm-${type}-${id}`,
    name,
    category,
    description: descriptionFor(name, category, operator),
    latitude,
    longitude,
    imageUrl: imageFor(tags),
    dataSource: "openstreetmap",
    address: addressFor(tags),
    tags: ["crna gora", "montenegro", name, category],
    metadata: {
      Izvor: "OpenStreetMap",
      ...(operator ? { Vodi: operator } : {}),
    },
  });

  return parsed.success ? parsed.data : null;
}

/** Turns an Overpass JSON payload into place cards. Rows without a name or category are dropped. */
export function placesFromOverpass(payload: unknown): MapLocation[] {
  if (
    !payload ||
    typeof payload !== "object" ||
    !("elements" in payload) ||
    !Array.isArray(payload.elements)
  ) {
    return [];
  }

  const places: MapLocation[] = [];
  const seen = new Set<string>();

  for (const element of payload.elements) {
    const place = placeFromElement(element as OverpassElement);
    if (!place || seen.has(place.id)) {
      continue;
    }

    seen.add(place.id);
    places.push(place);
  }

  return places;
}
