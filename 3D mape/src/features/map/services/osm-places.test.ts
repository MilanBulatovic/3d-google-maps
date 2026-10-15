import { describe, expect, it } from "vitest";

import { placesFromOverpass } from "@/features/map/services/osm-places";

describe("placesFromOverpass", () => {
  it("keeps named venues and a Wikimedia photo", () => {
    const places = placesFromOverpass({
      elements: [
        {
          type: "node",
          id: 10,
          lat: 42.43,
          lon: 19.26,
          tags: {
            name: 'Vrtić "Pinokio"',
            amenity: "kindergarten",
            operator: "Artić Pinokio",
            wikimedia_commons: "File:Pinokio vrtic.jpg",
          },
        },
        {
          type: "way",
          id: 11,
          center: { lat: 42.44, lon: 19.25 },
          tags: {
            name: "Radionica Mali umjetnici",
            leisure: "indoor_play",
          },
        },
        {
          type: "node",
          id: 12,
          lat: 42.1,
          lon: 19.1,
          tags: { amenity: "kindergarten" },
        },
        {
          type: "node",
          id: 13,
          lat: 42.2,
          lon: 19.2,
          tags: {
            name: "Vuki Kids",
            leisure: "indoor_play",
            image: "https://example.com/photo.jpg",
          },
        },
        {
          type: "node",
          id: 14,
          lat: 42.3,
          lon: 19.3,
          tags: {
            name: "Igralište Njegošev park",
            leisure: "playground",
          },
        },
        {
          type: "node",
          id: 15,
          lat: 42.31,
          lon: 19.31,
          tags: {
            name: "UP Igraonica",
            leisure: "playground",
          },
        },
      ],
    });

    expect(places.map((place) => place.id)).toEqual([
      "osm-node-10",
      "osm-way-11",
      "osm-node-13",
      "osm-node-14",
      "osm-node-15",
    ]);
    expect(places[0]).toMatchObject({
      category: "Vrtić",
      dataSource: "openstreetmap",
      imageUrl:
        "https://commons.wikimedia.org/wiki/Special:FilePath/Pinokio_vrtic.jpg",
      metadata: { Izvor: "OpenStreetMap", Vodi: "Artić Pinokio" },
    });
    expect(places[1]?.category).toBe("Dječija radionica");
    expect(places[2]?.category).toBe("Rođendaonica");
    expect(places[2]?.imageUrl).toBeUndefined();
    expect(places[3]).toMatchObject({
      category: "Igralište",
      description: "Igralište Njegošev park je igralište u Crnoj Gori.",
    });
    expect(places[4]?.category).toBe("Rođendaonica");
  });

  it("returns nothing for a payload without elements", () => {
    expect(placesFromOverpass({})).toEqual([]);
    expect(placesFromOverpass(null)).toEqual([]);
  });
});
