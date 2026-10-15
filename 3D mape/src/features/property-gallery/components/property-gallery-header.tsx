"use client";

import { X } from "lucide-react";
import type { RefObject } from "react";

import type {
  PropertyDetails,
  PropertyViewMode,
} from "@/features/property-gallery/types";

type PropertyGalleryHeaderProps = {
  title: string;
  location: string;
  details?: PropertyDetails;
  closeRef: RefObject<HTMLButtonElement | null>;
  panoramaAvailable: boolean;
  viewMode: PropertyViewMode;
  onViewModeChange: (mode: PropertyViewMode) => void;
  onClose: () => void;
};

function countLabel(count: number, singular: string, plural: string): string {
  return `${count} ${count === 1 ? singular : plural}`;
}

export function PropertyGalleryHeader({
  title,
  location,
  details,
  closeRef,
  panoramaAvailable,
  viewMode,
  onViewModeChange,
  onClose,
}: PropertyGalleryHeaderProps) {
  return (
    <div className="pointer-events-none absolute inset-x-0 top-0 z-10 bg-gradient-to-b from-black/70 via-black/35 to-transparent px-4 pt-[max(0.75rem,env(safe-area-inset-top))] pb-16 sm:px-6">
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 pt-1">
          <h2
            id="property-gallery-title"
            className="truncate text-xl font-semibold tracking-tight text-white sm:text-2xl"
          >
            {title}
          </h2>
          <p className="mt-1 truncate text-sm text-white/80">{location}</p>
          {details ? (
            <dl className="mt-3 flex max-w-xl flex-wrap gap-2 text-xs text-white">
              <div className="rounded-full bg-black/40 px-3 py-1">
                <dt className="sr-only">Price</dt>
                <dd>{details.price}</dd>
              </div>
              <div className="rounded-full bg-black/40 px-3 py-1">
                <dt className="sr-only">Area</dt>
                <dd>{details.area}</dd>
              </div>
              <div className="rounded-full bg-black/40 px-3 py-1">
                <dt className="sr-only">Bedrooms</dt>
                <dd>{countLabel(details.bedrooms, "bedroom", "bedrooms")}</dd>
              </div>
              <div className="rounded-full bg-black/40 px-3 py-1">
                <dt className="sr-only">Bathrooms</dt>
                <dd>{countLabel(details.bathrooms, "bathroom", "bathrooms")}</dd>
              </div>
            </dl>
          ) : null}
          {panoramaAvailable ? (
            <div className="pointer-events-auto mt-3 flex gap-2">
              <button
                type="button"
                className="rounded-full bg-white px-3 py-2 text-xs font-medium text-[#1c1917] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-pressed={viewMode === "photos"}
                onClick={() => onViewModeChange("photos")}
              >
                Photographs
              </button>
              <button
                type="button"
                className="rounded-full bg-black/40 px-3 py-2 text-xs font-medium text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
                aria-pressed={viewMode === "panorama"}
                onClick={() => onViewModeChange("panorama")}
              >
                360° view
              </button>
            </div>
          ) : null}
        </div>
        <button
          ref={closeRef}
          type="button"
          className="pointer-events-auto inline-flex size-11 shrink-0 items-center justify-center rounded-full bg-black/45 text-white ring-1 ring-white/30 backdrop-blur-sm hover:bg-black/60 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white"
          onClick={onClose}
          aria-label="Close gallery"
        >
          <X className="size-5" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
}
