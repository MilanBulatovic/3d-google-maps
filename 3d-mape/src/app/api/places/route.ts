import { LOCAL_VENUES } from "@/features/map/data/locations";
import {
  OVERPASS_PLACE_SELECTORS,
  overpassQuery,
  placesFromOverpass,
} from "@/features/map/services/osm-places";
import type { MapLocation } from "@/features/map/types/map-location";

export const dynamic = "force-dynamic";

const OVERPASS_URLS = [
  "https://overpass.openstreetmap.fr/api/interpreter",
  "https://overpass.osm.ch/api/interpreter",
  "https://overpass-api.de/api/interpreter",
];
const ATTEMPT_MS = 12_000;
const LIVE_CACHE_MS = 120_000;
const LOCAL_CACHE_MS = 30_000;

type PlacesPayload = {
  places: MapLocation[];
  source: "live" | "local";
};

let cached: { at: number; ttl: number; payload: PlacesPayload } | null = null;
let inflight: Promise<PlacesPayload> | null = null;

async function fetchSelector(url: string, selector: string): Promise<MapLocation[]> {
  const response = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded;charset=UTF-8",
      Accept: "application/json",
      "User-Agent": "podgorica-3d-map/0.1 (live place list)",
    },
    body: new URLSearchParams({ data: overpassQuery(selector) }),
    cache: "no-store",
    signal: AbortSignal.timeout(ATTEMPT_MS),
  });

  if (!response.ok) {
    throw new Error(`Overpass responded with ${response.status}.`);
  }

  return placesFromOverpass(await response.json());
}

async function fetchFrom(url: string): Promise<MapLocation[]> {
  const places: MapLocation[] = [];
  const seen = new Set<string>();

  for (const selector of OVERPASS_PLACE_SELECTORS) {
    let batch: MapLocation[] = [];
    try {
      batch = await fetchSelector(url, selector);
    } catch {
      continue;
    }

    for (const place of batch) {
      if (seen.has(place.id)) {
        continue;
      }

      seen.add(place.id);
      places.push(place);
    }
  }

  if (places.length === 0) {
    throw new Error("Overpass returned no places.");
  }

  return places;
}

async function fetchPlaces(): Promise<PlacesPayload> {
  for (const url of OVERPASS_URLS) {
    try {
      return { places: await fetchFrom(url), source: "live" };
    } catch {
      continue;
    }
  }

  return { places: LOCAL_VENUES, source: "local" };
}

function loadPlaces(): Promise<PlacesPayload> {
  if (cached && Date.now() - cached.at < cached.ttl) {
    return Promise.resolve(cached.payload);
  }

  if (!inflight) {
    inflight = fetchPlaces()
      .then((payload) => {
        cached = {
          at: Date.now(),
          ttl: payload.source === "live" ? LIVE_CACHE_MS : LOCAL_CACHE_MS,
          payload,
        };
        return payload;
      })
      .finally(() => {
        inflight = null;
      });
  }

  return inflight;
}

export async function GET() {
  const { places, source } = await loadPlaces();
  return Response.json(
    { places, source },
    {
      headers: {
        "Cache-Control":
          source === "live" ? "private, no-cache" : "private, max-age=30",
      },
    },
  );
}
