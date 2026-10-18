"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import {
  FLOOR_HOTSPOTS,
  type FloorHotspot,
  type FloorView,
} from "@/features/scene/data/house-hotspots";

const ExampleScene = dynamic(
  () =>
    import("@/features/scene/components/example-scene").then(
      (module) => module.ExampleScene,
    ),
  { ssr: false },
);

type SceneViewProps = {
  active?: boolean;
  resetToken?: number;
};

export function SceneView({ active = true, resetToken = 0 }: SceneViewProps) {
  const [selectedId, setSelectedId] = useState<FloorHotspot["id"] | null>(
    null,
  );
  const [view, setView] = useState<FloorView>("outside");
  const [hoveredId, setHoveredId] = useState<FloorHotspot["id"] | null>(null);
  const anchorRef = useRef<HTMLDivElement>(null);
  const selected =
    FLOOR_HOTSPOTS.find((hotspot) => hotspot.id === selectedId) ?? null;
  const hovered =
    FLOOR_HOTSPOTS.find((hotspot) => hotspot.id === hoveredId) ?? null;
  const callout = selected ? null : hovered;

  useEffect(() => {
    setSelectedId(null);
    setView("outside");
    setHoveredId(null);
  }, [resetToken]);

  function selectFloor(id: FloorHotspot["id"] | null) {
    if (id === null) {
      setSelectedId(null);
      setView("outside");
      return;
    }
    if (id === selectedId && view === "extracted") {
      setView("inside");
      return;
    }
    if (id === selectedId) return;
    setSelectedId(id);
    setView("extracted");
  }

  function stepBack() {
    if (view === "inside") {
      setView("extracted");
      return;
    }
    setSelectedId(null);
    setView("outside");
  }

  return (
    <div className="relative h-full w-full">
      <ExampleScene
        selectedId={selectedId}
        view={view}
        hoveredId={callout?.id ?? null}
        anchorRef={anchorRef}
        onSelect={selectFloor}
        onHover={setHoveredId}
        active={active}
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
                {view === "inside"
                  ? "Kamera je u stanu. Nazad vraća pogled na izvučeni sprat."
                  : "Sprat je izvučen ispred zgrade. Klikni tačku ponovo da uđeš unutra."}
              </p>
            </div>
            <div className="flex shrink-0 flex-col gap-2">
              {view === "extracted" ? (
                <button
                  type="button"
                  onClick={() => setView("inside")}
                  className="rounded-full bg-[#f4efe4] px-3 py-1 text-sm whitespace-nowrap text-[#1c2420] transition hover:bg-white"
                >
                  Uđi unutra
                </button>
              ) : null}
              <button
                type="button"
                onClick={stepBack}
                className="rounded-full border border-white/15 px-3 py-1 text-sm whitespace-nowrap text-[#f4efe4] transition hover:bg-white/10"
              >
                {view === "inside" ? "Nazad na sprat" : "Vrati sprat"}
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
