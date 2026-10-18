import { describe, expect, it } from "vitest";

import {
  buildMapsDirectionsUrl,
  buildMapsSearchUrl,
} from "@/features/map/utils/google-maps-url";

describe("Google Maps URLs", () => {
  it("builds a search URL from coordinates", () => {
    expect(buildMapsSearchUrl(42.445131, 19.258355)).toBe(
      "https://www.google.com/maps/search/?api=1&query=42.445131%2C19.258355",
    );
  });

  it("builds a directions URL with the place as the destination", () => {
    expect(buildMapsDirectionsUrl(42.444839, 19.264288)).toBe(
      "https://www.google.com/maps/dir/?api=1&destination=42.444839%2C19.264288",
    );
  });

  it("rejects coordinates outside the valid range", () => {
    expect(buildMapsSearchUrl(91, 19)).toBeNull();
    expect(buildMapsDirectionsUrl(42, 181)).toBeNull();
    expect(buildMapsSearchUrl(Number.NaN, 19)).toBeNull();
  });
});
