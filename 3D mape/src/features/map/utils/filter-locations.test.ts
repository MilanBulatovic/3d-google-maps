import { describe, expect, it } from "vitest";

import { LOCATIONS } from "@/features/map/data/locations";
import { filterLocations } from "@/features/map/utils/filter-locations";

describe("filterLocations", () => {
  it("returns every place when the query is empty and the category is all", () => {
    expect(filterLocations(LOCATIONS, { query: "  ", category: "all" })).toEqual(
      LOCATIONS,
    );
  });

  it("matches name, category, description, and tags", () => {
    expect(
      filterLocations(LOCATIONS, { query: "milenijum", category: "all" }).map(
        (location) => location.id,
      ),
    ).toEqual(["millennium-bridge"]);

    expect(
      filterLocations(LOCATIONS, { query: "worship", category: "all" }).map(
        (location) => location.id,
      ),
    ).toEqual(["cathedral-of-the-resurrection"]);

    expect(
      filterLocations(LOCATIONS, { query: "ottoman", category: "all" }).map(
        (location) => location.id,
      ),
    ).toContain("sahat-kula");

    expect(
      filterLocations(LOCATIONS, { query: "delta city", category: "all" }).map(
        (location) => location.id,
      ),
    ).toEqual(["big-fashion"]);

    expect(
      filterLocations(LOCATIONS, { query: "vrtic", category: "Vrtić" }).length,
    ).toBeGreaterThan(0);
    expect(
      filterLocations(LOCATIONS, { query: "rodjendaonica", category: "all" }).some(
        (location) => location.category === "Rođendaonica",
      ),
    ).toBe(true);
  });

  it("filters by category and reports an empty match", () => {
    const sport = filterLocations(LOCATIONS, { query: "", category: "Sport" });
    expect(sport.map((location) => location.id)).toEqual(["stadion-pod-goricom"]);

    expect(
      filterLocations(LOCATIONS, { query: "bridge", category: "Sport" }),
    ).toEqual([]);
  });
});
