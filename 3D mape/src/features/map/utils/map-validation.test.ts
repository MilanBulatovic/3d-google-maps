import { describe, expect, it } from "vitest";

import { LOCATIONS, MAP_PINS } from "@/features/map/data/locations";
import {
  isValidCoordinate,
  parseMapLocations,
} from "@/features/map/utils/map-validation";

describe("coordinate validation", () => {
  it("accepts the edges of the valid range", () => {
    expect(isValidCoordinate(90, 180)).toBe(true);
    expect(isValidCoordinate(-90, -180)).toBe(true);
  });

  it("rejects out-of-range and non-finite coordinates", () => {
    expect(isValidCoordinate(90.0001, 0)).toBe(false);
    expect(isValidCoordinate(0, -180.0001)).toBe(false);
    expect(isValidCoordinate(Number.POSITIVE_INFINITY, 0)).toBe(false);
  });

  it("loads three plain pins and three building pins", () => {
    expect(MAP_PINS.filter((pin) => pin.pinStyle === "plain")).toHaveLength(3);
    expect(MAP_PINS.filter((pin) => pin.pinStyle === "model")).toHaveLength(3);
    expect(new Set(MAP_PINS.map((pin) => pin.id)).size).toBe(MAP_PINS.length);
  });

  it("loads Montenegro places with unique ids", () => {
    expect(LOCATIONS.length).toBeGreaterThan(1);
    expect(new Set(LOCATIONS.map((location) => location.id)).size).toBe(
      LOCATIONS.length,
    );
    expect(LOCATIONS.some((location) => location.id === "millennium-bridge")).toBe(true);
    expect(LOCATIONS.some((location) => location.category === "Vrtić")).toBe(true);
    expect(LOCATIONS.some((location) => location.category === "Rođendaonica")).toBe(
      true,
    );
    expect(
      LOCATIONS.some((location) => location.category === "Dječija radionica"),
    ).toBe(true);
  });

  it("rejects duplicate location ids", () => {
    expect(() =>
      parseMapLocations([
        {
          id: "same",
          name: "One",
          category: "Landmark",
          description: "First",
          latitude: 42.44,
          longitude: 19.26,
        },
        {
          id: "same",
          name: "Two",
          category: "Landmark",
          description: "Second",
          latitude: 42.45,
          longitude: 19.27,
        },
      ]),
    ).toThrow(/Duplicate location id: same/);
  });
});
