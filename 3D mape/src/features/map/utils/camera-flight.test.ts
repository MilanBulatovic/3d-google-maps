import { describe, expect, it } from "vitest";

import {
  BIRDS_EYE_CAMERA,
  APPROACH_CAMERA,
} from "@/features/map/config/camera";
import {
  buildLocationFlight,
  normalizeHeading,
} from "@/features/map/utils/camera-flight";

describe("camera flight", () => {
  it("wraps heading into 0–360 degrees", () => {
    expect(normalizeHeading(0)).toBe(0);
    expect(normalizeHeading(370)).toBe(10);
    expect(normalizeHeading(-10)).toBe(350);
  });

  it("builds an approach followed by a closer bird's-eye view", () => {
    const flight = buildLocationFlight({
      latitude: 42.445131,
      longitude: 19.258355,
    });

    expect(flight.approach.center).toEqual(flight.birdsEye.center);
    expect(flight.approach.center.lat).toBe(42.445131);
    expect(flight.approach.center.lng).toBe(19.258355);
    expect(flight.approach.range).toBe(APPROACH_CAMERA.range);
    expect(flight.birdsEye.range).toBe(BIRDS_EYE_CAMERA.range);
    expect(flight.birdsEye.range).toBeLessThan(flight.approach.range);
    expect(flight.approach.tilt).toBe(APPROACH_CAMERA.tilt);
    expect(flight.birdsEye.tilt).toBe(BIRDS_EYE_CAMERA.tilt);
    expect(flight.birdsEye.tilt).toBeLessThan(flight.approach.tilt);
    expect(flight.birdsEye.tilt).toBeGreaterThan(0);
    expect(flight.birdsEye.roll).toBe(0);
    expect(flight.birdsEye.altitudeMode).toBe("RELATIVE_TO_GROUND");
    expect(flight.birdsEye.center.altitude).toBe(0);
  });

  it("keeps a country-scale flight wider than the close bird's-eye", () => {
    const flight = buildLocationFlight({
      latitude: 42.71,
      longitude: 19.37,
      altitude: 800,
      viewRange: 260000,
      viewTilt: 55,
    });

    expect(flight.birdsEye.range).toBe(260000);
    expect(flight.approach.range).toBeGreaterThan(flight.birdsEye.range);
    expect(flight.birdsEye.tilt).toBe(55);
    expect(flight.birdsEye.center.altitude).toBe(800);
    expect(flight.birdsEye.altitudeMode).toBe("ABSOLUTE");
  });
});
