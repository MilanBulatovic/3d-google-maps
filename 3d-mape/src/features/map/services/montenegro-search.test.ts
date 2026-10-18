import { describe, expect, it } from "vitest";

import {
  montenegroCategory,
  needsPlaceDetails,
} from "@/features/map/services/montenegro-search";

describe("Montenegro search labels", () => {
  it("labels cities, addresses, and other places", () => {
    expect(montenegroCategory(["locality", "political"])).toBe("Grad");
    expect(montenegroCategory(["street_address"])).toBe("Adresa");
    expect(montenegroCategory(["route"])).toBe("Adresa");
    expect(montenegroCategory(["point_of_interest", "establishment"])).toBe("Mjesto");
  });

  it("treats a suggestion without coordinates as unresolved", () => {
    expect(
      needsPlaceDetails({
        id: "me-1",
        name: "Nikšić",
        category: "Grad",
        description: "Nikšić, Crna Gora",
        latitude: 0,
        longitude: 0,
      }),
    ).toBe(true);
    expect(
      needsPlaceDetails({
        id: "me-2",
        name: "Nikšić",
        category: "Grad",
        description: "Nikšić, Crna Gora",
        latitude: 42.77,
        longitude: 18.94,
      }),
    ).toBe(false);
  });
});
