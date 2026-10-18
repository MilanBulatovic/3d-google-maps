"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

import type { PropertyImage } from "@/features/property-gallery/types";

type PropertyThumbnailStripProps = {
  images: PropertyImage[];
  index: number;
  failedIds: ReadonlySet<string>;
  onSelect: (index: number) => void;
  onFail: (id: string) => void;
};

export function PropertyThumbnailStrip({
  images,
  index,
  failedIds,
  onSelect,
  onFail,
}: PropertyThumbnailStripProps) {
  const buttons = useRef<Array<HTMLButtonElement | null>>([]);

  useEffect(() => {
    const button = buttons.current[index];
    if (!button || typeof button.scrollIntoView !== "function") {
      return;
    }

    button.scrollIntoView({
      inline: "nearest",
      block: "nearest",
    });
  }, [index]);

  if (images.length === 0) {
    return null;
  }

  return (
    <div className="absolute inset-x-0 bottom-0 z-10 bg-gradient-to-t from-black/80 via-black/45 to-transparent px-3 pt-10 pb-[max(0.75rem,env(safe-area-inset-bottom))] sm:px-6">
      <div className="mx-auto flex max-w-3xl gap-2 overflow-x-auto">
        {images.map((image, imageIndex) => {
          const selected = imageIndex === index;
          const label = image.roomLabel
            ? `Show ${image.roomLabel}`
            : `Show photograph ${imageIndex + 1}`;

          return (
            <button
              key={image.id}
              ref={(node) => {
                buttons.current[imageIndex] = node;
              }}
              type="button"
              className={`relative h-16 w-24 shrink-0 overflow-hidden rounded-xl ring-2 focus-visible:outline-none focus-visible:ring-white ${
                selected ? "ring-white" : "ring-transparent"
              }`}
              aria-label={label}
              aria-current={selected ? "true" : undefined}
              onClick={() => onSelect(imageIndex)}
            >
              {failedIds.has(image.id) ? (
                <span className="flex h-full items-center justify-center bg-[#44403c] text-[10px] text-white">
                  No photo
                </span>
              ) : (
                <Image
                  src={image.src}
                  alt=""
                  fill
                  sizes="96px"
                  className="object-cover"
                  onError={() => onFail(image.id)}
                />
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
