import { render, waitFor } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import { MapCanvas } from "@/features/map/components/map-canvas";
import { LOCATIONS } from "@/features/map/data/locations";

vi.mock("@/features/map/services/google-maps-loader", () => {
  class Map3DElement extends HTMLElement {
    mode: string | null = null;
    center: { lat: number; lng: number; altitude: number } | null = null;
    range: number | null = null;
    tilt: number | null = null;
    heading: number | null = null;
    roll: number | null = null;

    constructor(options?: { mode?: string | null }) {
      super();
      this.mode = options?.mode ?? null;
    }

    flyCameraTo() {}

    stopCameraAnimation() {}
  }

  class Marker3DInteractiveElement extends HTMLElement {
    label: string | null = null;
    title = "";
    zIndex: number | null = null;
    collisionPriority: number | null = null;

    constructor(options?: { label?: string | null; title?: string }) {
      super();
      this.label = options?.label ?? null;
      this.title = options?.title ?? "";
    }
  }

  class PinElement extends HTMLElement {
    background: string | null = null;
    borderColor: string | null = null;
    glyphColor: string | null = null;
    scale: number | null = null;
  }

  if (!customElements.get("gmp-map-3d")) {
    customElements.define("gmp-map-3d", Map3DElement);
  }
  if (!customElements.get("gmp-marker-3d-interactive")) {
    customElements.define("gmp-marker-3d-interactive", Marker3DInteractiveElement);
  }
  if (!customElements.get("gmp-pin")) {
    customElements.define("gmp-pin", PinElement);
  }

  return {
    loadGoogleMaps3d: vi.fn(async () => ({
      Map3DElement,
      Marker3DInteractiveElement,
      PinElement,
    })),
  };
});

const canvasProps = {
  apiKey: "test-key",
  locations: LOCATIONS,
  mode: "SATELLITE" as const,
  onSelect: vi.fn(),
  onReady: vi.fn(),
  onUnavailable: vi.fn(),
  onError: vi.fn(),
};

describe("MapCanvas", () => {
  it("creates one 3D map and keeps it when the selection changes", async () => {
    const onSelect = vi.fn();
    const { rerender } = render(
      <MapCanvas {...canvasProps} selectedId={null} onSelect={onSelect} />,
    );

    await waitFor(() => {
      expect(document.querySelectorAll("gmp-map-3d")).toHaveLength(1);
    });
    expect(document.querySelectorAll("gmp-marker-3d-interactive")).toHaveLength(
      LOCATIONS.length,
    );

    rerender(
      <MapCanvas
        {...canvasProps}
        selectedId="millennium-bridge"
        onSelect={onSelect}
      />,
    );

    expect(document.querySelectorAll("gmp-map-3d")).toHaveLength(1);

    const marker = document.querySelector("gmp-marker-3d-interactive");
    marker?.dispatchEvent(new Event("gmp-click"));
    expect(onSelect).toHaveBeenCalled();
  });
});
