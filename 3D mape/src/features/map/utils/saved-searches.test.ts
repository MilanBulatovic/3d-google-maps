import { describe, expect, it } from "vitest";

import type { MapLocation } from "@/features/map/types/map-location";
import {
  mergeMapPins,
  readSavedSearches,
  rememberSavedSearch,
  SAVED_SEARCHES_KEY,
  writeSavedSearches,
} from "@/features/map/utils/saved-searches";

function place(id: string, latitude = 42.44, longitude = 19.26): MapLocation {
  return {
    id,
    name: id,
    category: "Mjesto",
    description: id,
    latitude,
    longitude,
  };
}

function memoryStorage(initial = ""): Storage {
  const values = new Map<string, string>();
  if (initial) {
    values.set(SAVED_SEARCHES_KEY, initial);
  }

  return {
    getItem: (key) => values.get(key) ?? null,
    setItem: (key, value) => {
      values.set(key, value);
    },
    removeItem: (key) => {
      values.delete(key);
    },
    clear: () => values.clear(),
    key: (index) => [...values.keys()][index] ?? null,
    get length() {
      return values.size;
    },
  };
}

describe("saved searches", () => {
  it("keeps a searched place and replaces the same id", () => {
    const first = rememberSavedSearch([], place("world-1"));
    const next = rememberSavedSearch(first, { ...place("world-1"), name: "Kotor" });

    expect(next).toHaveLength(1);
    expect(next[0]?.name).toBe("Kotor");
  });

  it("skips a suggestion that has no coordinates yet", () => {
    const current = [place("world-1")];
    expect(rememberSavedSearch(current, place("world-2", 0, 0))).toBe(current);
  });

  it("reads only valid stored places", () => {
    const storage = memoryStorage(
      JSON.stringify([place("world-1"), { id: "broken" }, place("world-0", 0, 0)]),
    );

    expect(readSavedSearches(storage).map((item) => item.id)).toEqual(["world-1"]);
  });

  it("writes places back to storage", () => {
    const storage = memoryStorage();
    writeSavedSearches(storage, [place("world-1")]);

    expect(readSavedSearches(storage).map((item) => item.id)).toEqual(["world-1"]);
  });

  it("draws saved places beside global pins without duplicating an id", () => {
    const globalPins = [place("landmark")];
    const saved = [place("landmark"), place("world-1")];

    expect(mergeMapPins(globalPins, saved).map((item) => item.id)).toEqual([
      "landmark",
      "world-1",
    ]);
  });
});
