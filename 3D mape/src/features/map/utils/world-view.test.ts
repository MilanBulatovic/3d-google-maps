import { describe, expect, it } from "vitest";

import { rangeFromSpan, tiltForRange, worldHitToLocation } from "@/features/map/utils/world-view";

describe("world view", () => {
  it("frames a city wider than a street", () => {
    const city = rangeFromSpan(40.92, 40.5, -73.7, -74.05, 40.71);
    const street = rangeFromSpan(40.713, 40.711, -74.005, -74.007, 40.712);

    expect(city).toBeGreaterThan(20_000);
    expect(street).toBeLessThan(2_000);
    expect(tiltForRange(city)).toBe(62);
    expect(tiltForRange(street)).toBe(32);
  });

  it("turns a geocoder hit into a fly-to location", () => {
    const location = worldHitToLocation({
      placeId: "nyc",
      name: "New York",
      formattedAddress: "New York, NY, USA",
      latitude: 40.7128,
      longitude: -74.006,
      north: 40.92,
      south: 40.5,
      east: -73.7,
      west: -74.05,
      types: ["locality", "political"],
    });

    expect(location.id).toBe("world-nyc");
    expect(location.name).toBe("New York");
    expect(location.viewRange).toBeUndefined();
    expect(location.dataSource).toBe("google");
  });

  it("keeps a country result at the wide frame", () => {
    const location = worldHitToLocation({
      placeId: "me",
      name: "Montenegro",
      formattedAddress: "Montenegro",
      latitude: 42.71,
      longitude: 19.37,
      north: 43.56,
      south: 41.85,
      east: 20.36,
      west: 18.43,
      types: ["country", "political"],
    });

    expect(location.viewRange).toBeGreaterThan(20_000);
    expect(location.viewTilt).toBe(62);
  });
});
