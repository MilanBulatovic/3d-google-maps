"use client";

import dynamic from "next/dynamic";
import { useState } from "react";

import {
  HOUSE_HOTSPOTS,
  type HouseHotspot,
} from "@/features/scene/data/house-hotspots";

const ExampleScene = dynamic(
  () =>
    import("@/features/scene/components/example-scene").then(
      (module) => module.ExampleScene,
    ),
  { ssr: false },
);

export function SceneView() {
  const [selectedId, setSelectedId] = useState<HouseHotspot["id"] | null>(
    null,
  );
  const selected =
    HOUSE_HOTSPOTS.find((hotspot) => hotspot.id === selectedId) ?? null;

  return (
    <div className="relative h-full w-full">
      <ExampleScene selectedId={selectedId} onSelect={setSelectedId} />
      {selected ? (
        <div className="absolute bottom-5 left-1/2 z-10 w-[min(22rem,calc(100%-2rem))] -translate-x-1/2 rounded-2xl border border-white/10 bg-[#1c2420]/92 p-4 text-[#f4efe4] shadow-lg backdrop-blur-md">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-xs font-medium tracking-[0.14em] text-[#c8d4c4] uppercase">
                Point
              </p>
              <h2 className="mt-1 text-lg font-semibold">{selected.title}</h2>
              <p className="mt-1 text-sm leading-relaxed text-[#d7e0d4]">
                {selected.detail}
              </p>
            </div>
            <button
              type="button"
              onClick={() => setSelectedId(null)}
              className="rounded-full border border-white/15 px-3 py-1 text-sm text-[#f4efe4] transition hover:bg-white/10"
            >
              Close
            </button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
