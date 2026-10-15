"use client";

import dynamic from "next/dynamic";
import { useRef, useState } from "react";

import {
  FLOOR_HOTSPOTS,
  type FloorHotspot,
} from "@/features/scene/data/house-hotspots";

const ExampleScene = dynamic(
  () =>
    import("@/features/scene/components/example-scene").then(
      (module) => module.ExampleScene,
    ),
  { ssr: false },
);

export function SceneView() {
  const [selectedId, setSelectedId] = useState<FloorHotspot["id"] | null>(
    null,
  );
  const [hoveredId, setHoveredId] = useState<FloorHotspot["id"] | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const selected =
    FLOOR_HOTSPOTS.find((hotspot) => hotspot.id === selectedId) ?? null;
  const hovered =
    FLOOR_HOTSPOTS.find((hotspot) => hotspot.id === hoveredId) ?? null;
  const callout = selected ? null : hovered;

  return (
    <div className="relative h-full w-full">
      <ExampleScene
        selectedId={selectedId}
        hoveredId={callout?.id ?? null}
        anchorRef={anchorRef}
        onSelect={setSelectedId}
        onHover={setHoveredId}
      />
      {callout ? (
        <div key={callout.id} ref={anchorRef} className="pin-callout">
          <div className="pin-callout-stem" aria-hidden="true">
            <span className="pin-callout-line" />
            <span className="pin-callout-elbow" />
          </div>
          <div data-callout-card className="pin-callout-card">
            <p className="text-xs font-medium tracking-[0.14em] text-[#c8d4c4] uppercase">
              Floor
            </p>
            <h2 className="mt-1 text-base font-semibold">{callout.title}</h2>
            <p className="mt-1 text-sm leading-relaxed text-[#d7e0d4]">
              {callout.detail}
            </p>
          </div>
        </div>
      ) : null}
      {selected ? (
        <div className="map-panel-in absolute bottom-5 left-1/2 z-10 w-[min(22rem,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#1c2420]/92 p-4 text-[#f4efe4] shadow-lg backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium tracking-[0.14em] text-[#c8d4c4] uppercase">
                Floor
              </p>
              <h2 className="mt-1 text-lg font-semibold">{selected.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-[#d7e0d4]">
                {selected.detail}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="shrink-0 rounded-full border border-white/15 px-3 py-1 text-sm whitespace-nowrap text-[#f4efe4] transition hover:bg-white/10"
            >
              Back outside
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
