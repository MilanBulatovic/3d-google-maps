import { importLibrary, setOptions } from "@googlemaps/js-api-loader";

export type Maps3dRuntime = {
  Map3DElement: typeof google.maps.maps3d.Map3DElement;
  Marker3DInteractiveElement: typeof google.maps.maps3d.Marker3DInteractiveElement;
  PinElement: typeof google.maps.marker.PinElement;
  PopoverElement: typeof google.maps.maps3d.PopoverElement;
};

const GOOGLE_MAPS_CHANNEL = "weekly";

let inflight: Promise<Maps3dRuntime> | null = null;

function toErrorMessage(error: unknown): string {
  if (error instanceof Error && error.message) {
    return error.message;
  }

  return "The Google Maps JavaScript API could not be loaded.";
}

async function loadRuntime(apiKey: string): Promise<Maps3dRuntime> {
  if (typeof window === "undefined") {
    throw new Error("Google Maps can only load in the browser.");
  }

  setOptions({
    key: apiKey,
    v: GOOGLE_MAPS_CHANNEL,
    language: "en",
    region: "ME",
  });

  const [maps3d, marker] = await Promise.all([
    importLibrary("maps3d"),
    importLibrary("marker"),
  ]);

  return {
    Map3DElement: maps3d.Map3DElement,
    Marker3DInteractiveElement: maps3d.Marker3DInteractiveElement,
    PinElement: marker.PinElement,
    PopoverElement: maps3d.PopoverElement,
  };
}

/** Loads the Maps JavaScript API once per page. A failed attempt can be retried. */
export function loadGoogleMaps3d(apiKey: string): Promise<Maps3dRuntime> {
  if (!inflight) {
    inflight = loadRuntime(apiKey).catch((error: unknown) => {
      inflight = null;
      throw new Error(toErrorMessage(error));
    });
  }

  return inflight;
}
