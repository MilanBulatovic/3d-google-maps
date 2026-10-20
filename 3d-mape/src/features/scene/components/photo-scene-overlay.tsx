"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState } from "react";

import type { PhotoSceneHandle } from "@/features/scene/components/photo-scene";

const PhotoScene = dynamic(
  () =>
    import("@/features/scene/components/photo-scene").then(
      (module) => module.PhotoScene,
    ),
  { ssr: false },
);

type PhotoSceneOverlayProps = {
  open: boolean;
  session: number;
  title: string;
  imageUrls: readonly string[];
  onClose: () => void;
};

export function PhotoSceneOverlay({
  open,
  session,
  title,
  imageUrls,
  onClose,
}: PhotoSceneOverlayProps) {
  const sceneRef = useRef<PhotoSceneHandle>(null);
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
      <PhotoScene
        ref={sceneRef}
        active={open}
        resetToken={session}
        imageUrls={imageUrls}
      />
      {open ? (
        <div className="pointer-events-none absolute inset-x-0 top-0 z-10 flex items-start justify-between gap-4 p-4 sm:p-6">
          <div className="max-w-sm text-[#f4efe4] drop-shadow-[0_2px_10px_rgba(0,0,0,0.75)]">
            <p className="text-xs font-medium tracking-[0.16em] text-[#c8d4c4] uppercase">
              Poslovnica
            </p>
            <h2 className="mt-1 text-2xl font-semibold tracking-tight">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-[#d7e0d4]">
              Klikni prozirnu sliku da je dovedeš u centar. Mišem okrećeš, približavaš i pomjeraš.
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
      {open && imageUrls.length > 1 ? (
        <>
          <button
            type="button"
            aria-label="Prethodna slika"
            onClick={() => sceneRef.current?.step(-1)}
            className="absolute top-1/2 left-4 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/30 text-2xl text-[#f4efe4] backdrop-blur-sm transition hover:bg-black/45"
          >
            ‹
          </button>
          <button
            type="button"
            aria-label="Sledeća slika"
            onClick={() => sceneRef.current?.step(1)}
            className="absolute top-1/2 right-4 z-20 flex size-11 -translate-y-1/2 items-center justify-center rounded-full border border-white/15 bg-black/30 text-2xl text-[#f4efe4] backdrop-blur-sm transition hover:bg-black/45"
          >
            ›
          </button>
        </>
      ) : null}
    </div>
  );
}
