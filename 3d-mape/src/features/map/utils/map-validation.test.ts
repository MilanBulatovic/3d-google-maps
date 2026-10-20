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

  it("loads plain pins, building pins, and One branches", () => {
    expect(MAP_PINS.filter((pin) => pin.pinStyle === "plain")).toHaveLength(21);
    expect(MAP_PINS.filter((pin) => pin.pinStyle === "model")).toHaveLength(3);
    expect(MAP_PINS.filter((pin) => pin.category === "Poslovnica")).toHaveLength(21);
    expect(new Set(MAP_PINS.map((pin) => pin.id)).size).toBe(MAP_PINS.length);

    const centar = MAP_PINS.find((pin) => pin.id === "one-centar");
    expect(centar?.latitude).toBe(42.44097078798397);
    expect(centar?.longitude).toBe(19.263518711515655);
    expect(centar?.address).toBe("Trg Republike bb, Podgorica");
    expect(MAP_PINS.find((pin) => pin.id === "one-tuzi")?.latitude).toBe(
      42.36570318389984,
    );
    expect(MAP_PINS.find((pin) => pin.id === "one-kolasin")?.longitude).toBe(
      19.52114309986878,
    );
    expect(MAP_PINS.find((pin) => pin.id === "one-bijelo-polje-2")?.latitude).toBe(
      43.05135798705961,
    );
    expect(centar?.metadata?.Telefon).toBe("1700");
    expect(centar?.metadata?.["E-mail"]).toBe("korisnickiservis@1.me");
    expect(centar?.metadata?.["Pon–pet"]).toBe("08:00–20:00*");
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
