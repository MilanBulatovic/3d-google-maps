import type { Metadata } from "next";
import Link from "next/link";

import { SceneView } from "@/features/scene/components/scene-view";

export const metadata: Metadata = {
  title: "Building scene",
  description:
    "A Three.js apartment building. Click a floor to pull it out, then click again to step inside.",
};

export default function ScenePage() {
  return (
    <main className="relative h-dvh bg-[#121612]">
      <SceneView />
      <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-4 p-4 sm:p-6">
        <div className="min-w-0 max-w-sm flex-1 text-[#f4efe4] drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)]">
          <p className="text-xs font-medium tracking-[0.16em] text-[#c8d4c4] uppercase">
            Three.js
          </p>
          <h1 className="mt-1 text-2xl font-semibold tracking-tight">
            Building scene
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#d7e0d4]">
            Hover a pulsing point to read the floor. The first click pulls that
            story out of the building. The second click steps inside.
          </p>
        </div>
        <Link
          href="/"
          className="pointer-events-auto shrink-0 rounded-full border border-white/15 bg-black/30 px-4 py-2 text-sm whitespace-nowrap text-[#f4efe4] backdrop-blur-sm transition hover:bg-black/45"
        >
          Back to map
        </Link>
      </div>
    </main>
  );
}
