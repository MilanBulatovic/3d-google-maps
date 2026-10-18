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
        {
          type: "node",
          id: 16,
          lat: 42.44,
          lon: 19.26,
          tags: {
            name: "Agencija Morača",
            office: "estate_agent",
          },
        },
        {
          type: "node",
          id: 17,
          lat: 42.45,
          lon: 19.27,
          tags: {
            name: "Stari oglas",
            shop: "estate_agent",
          },
        },
        {
          type: "node",
          id: 18,
          lat: 42.44,
          lon: 19.26,
          tags: { name: "CB Podgorica", amenity: "police" },
        },
        {
          type: "node",
          id: 19,
          lat: 42.44,
          lon: 19.25,
          tags: { name: "Vatrogasci Podgorica", amenity: "fire_station" },
        },
        {
          type: "node",
          id: 20,
          lat: 42.43,
          lon: 19.24,
          tags: { name: "ZHMP", emergency: "ambulance_station" },
        },
        {
          type: "way",
          id: 21,
          center: { lat: 42.43, lon: 19.25 },
          tags: { name: "Klinički centar", healthcare: "hospital" },
        },
        {
          type: "node",
          id: 22,
          lat: 42.9,
          lon: 19.4,
          tags: { name: "GSS Durmitor", emergency: "mountain_rescue" },
        },
       
      ],
    });

    expect(places.map((place) => place.id)).toEqual([
      "osm-node-10",
      "osm-way-11",
      "osm-node-13",
      "osm-node-14",
      "osm-node-15",
      "osm-node-16",
      "osm-node-17",
      "osm-node-18",
      "osm-node-19",
      "osm-node-20",
      "osm-way-21",
      "osm-node-22",
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
    expect(places[5]).toMatchObject({
      category: "Nekretnine",
      description: "Agencija Morača je agencija za nekretnine u Crnoj Gori.",
    });
    expect(places[6]?.category).toBe("Nekretnine");
    expect(places.slice(7).map((place) => place.category)).toEqual([
      "Policija",
      "Vatrogasci",
      "Hitna pomoć",
      "Bolnica",
      "Gorska služba",
    ]);
    expect(places[7]?.description).toBe("CB Podgorica je policijska stanica u Crnoj Gori.");
  });

  it("returns nothing for a payload without elements", () => {
    expect(placesFromOverpass({})).toEqual([]);
    expect(placesFromOverpass(null)).toEqual([]);
  });
});
