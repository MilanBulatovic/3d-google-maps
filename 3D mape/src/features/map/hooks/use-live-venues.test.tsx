import { renderHook, waitFor } from "@testing-library/react";
import { afterEach, describe, expect, it, vi } from "vitest";

import { LOCAL_VENUES } from "@/features/map/data/locations";
import { useLiveVenues } from "@/features/map/hooks/use-live-venues";

const livePlace = {
  id: "osm-node-1",
  name: "Vrtić Test",
  category: "Vrtić",
  description: "Vrtić Test je vrtić u Crnoj Gori.",
  latitude: 42.43,
  longitude: 19.26,
  dataSource: "openstreetmap",
};

describe("useLiveVenues", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("uses the live list when the request succeeds", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ places: [livePlace] })),
    );

    const { result } = renderHook(() => useLiveVenues());

    await waitFor(() => {
      expect(result.current.source).toBe("live");
    });
    expect(result.current.places.map((place) => place.id)).toEqual(["osm-node-1"]);
  });

  it("uses the saved list only when the live request fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => Response.json({ places: [] }, { status: 502 })),
    );

    const { result } = renderHook(() => useLiveVenues());

    await waitFor(() => {
      expect(result.current.source).toBe("local");
    });
    expect(result.current.places).toBe(LOCAL_VENUES);
  });

  it("keeps the saved list when Overpass is down and the API says so", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () =>
        Response.json({
          places: [LOCAL_VENUES[0]],
          source: "local",
        }),
      ),
    );

    const { result } = renderHook(() => useLiveVenues());

    await waitFor(() => {
      expect(result.current.source).toBe("local");
    });
    expect(result.current.places).toEqual([LOCAL_VENUES[0]]);
  });
});
