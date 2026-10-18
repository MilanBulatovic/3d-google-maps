"use client";

import { useEffect, useState } from "react";

import { SceneView } from "@/features/scene/components/scene-view";

type BuildingSceneOverlayProps = {
  open: boolean;
  session: number;
  title: string;
  onClose: () => void;
};

export function BuildingSceneOverlay({
  open,
  session,
  title,
  onClose,
}: BuildingSceneOverlayProps) {
  const [kept, setKept] = useState(open);

  useEffect(() => {
    if (open) {
      setTimeout(() => {
        setKept(true);
      }, 0);
    }
  }, [open]);

  if (!kept) {
    return null;
  }

  return (
    <div
      className={
        open
          ? "building-overlay"
          : "building-overlay building-overlay-parked"
      }
      aria-hidden={open ? undefined : true}
    >
      <SceneView active={open} resetToken={session} />
      {open ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-4 p-4 sm:p-6">
          <div className="max-w-sm text-[#f4efe4] drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)]">
            <p className="text-xs font-medium tracking-[0.16em] text-[#c8d4c4] uppercase">
              Zgrada
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#d7e0d4]">
              Klikni tačku na spratu da ga izvučeš iz zgrade. Još jedan klik ulazi u stan.
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="pointer-events-auto rounded-full border border-white/15 bg-black/30 px-4 py-2 text-sm text-[#f4efe4] backdrop-blur-sm transition hover:bg-black/45"
          >
            Nazad na mapu
          </button>
        </div>
      ) : null}
    </div>
  );
}
