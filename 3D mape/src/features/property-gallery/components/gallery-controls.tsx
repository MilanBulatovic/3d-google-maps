"use client";

import { ChevronLeft, ChevronRight, Pause, Play } from "lucide-react";

type GalleryControlsProps = {
  index: number;
  total: number;
  slideshow: boolean;
  slideshowDisabled: boolean;
  onPrevious: () => void;
  onNext: () => void;
  onToggleSlideshow: () => void;
};

export function GalleryControls({
  index,
  total,
  slideshow,
  slideshowDisabled,
  onPrevious,
  onNext,
  onToggleSlideshow,
}: GalleryControlsProps) {
  const atEndsDisabled = total < 2;

  return (
    <>
      <button
        type="button"
        className="absolute top-1/2 left-3 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/25 backdrop-blur-sm hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40 sm:left-5"
        onClick={onPrevious}
        disabled={atEndsDisabled}
        aria-label="Previous photograph"
      >
        <ChevronLeft className="size-5" aria-hidden="true" />
      </button>
      <button
        type="button"
        className="absolute top-1/2 right-3 z-10 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/25 backdrop-blur-sm hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40 sm:right-5"
        onClick={onNext}
        disabled={atEndsDisabled}
        aria-label="Next photograph"
      >
        <ChevronRight className="size-5" aria-hidden="true" />
      </button>
      <div className="absolute bottom-24 left-1/2 z-10 flex -translate-x-1/2 items-center gap-2 rounded-full bg-black/45 px-2 py-1 text-sm text-white ring-1 ring-white/20 backdrop-blur-sm sm:bottom-28">
        <p className="min-w-12 px-2 text-center tabular-nums" aria-live="polite">
          {total === 0 ? "0 / 0" : `${index + 1} / ${total}`}
        </p>
        <button
          type="button"
          className="inline-flex size-11 items-center justify-center rounded-full hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white disabled:opacity-40"
          aria-pressed={slideshow}
          aria-label={slideshow ? "Pause slideshow" : "Play slideshow"}
          disabled={slideshowDisabled}
          onClick={onToggleSlideshow}
        >
          {slideshow ? (
            <Pause className="size-4" aria-hidden="true" />
          ) : (
            <Play className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    </>
  );
}
