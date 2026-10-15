"use client";

import { ExternalLink, Images, MapPin, Navigation, X } from "lucide-react";
import Image from "next/image";
import { useEffect, useState } from "react";

import { ImageCreditLine } from "@/components/image-credit";
import { Button } from "@/components/ui/button";
import type { ImageCredit, MapLocation } from "@/features/map/types/map-location";
import {
  GOOGLE_MAPS_URL,
  OSM_COPYRIGHT_URL,
  placeDataSource,
} from "@/features/map/utils/attribution";
import {
  buildMapsDirectionsUrl,
  buildMapsSearchUrl,
} from "@/features/map/utils/google-maps-url";

type LocationInfoCardProps = {
  location: MapLocation;
  onClose: () => void;
  onShowOverview: () => void;
  onViewProperty?: () => void;
  escapeDisabled?: boolean;
};

function formatMetadataLabel(key: string): string {
  const spaced = key.replace(/([A-Z])/g, " $1");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function LocationImage({
  src,
  name,
  credit,
}: {
  src?: string;
  name: string;
  credit?: ImageCredit;
}) {
  const [failed, setFailed] = useState(false);

  if (!src || failed) {
    return (
      <div className="flex h-36 shrink-0 items-center justify-center bg-[#e7e5e4] text-[#57534e] sm:h-44">
        <MapPin className="size-8" aria-hidden="true" />
        <span className="sr-only">No photo available for {name}</span>
      </div>
    );
  }

  return (
    <div className="relative h-36 shrink-0 bg-[#e7e5e4] sm:h-44">
      <Image
        src={src}
        alt=""
        fill
        sizes="(min-width: 768px) 22rem, 100vw"
        className="object-cover"
        onError={() => setFailed(true)}
      />
      {credit ? <ImageCreditLine credit={credit} /> : null}
    </div>
  );
}

export function LocationInfoCard({
  location,
  onClose,
  onShowOverview,
  onViewProperty,
  escapeDisabled = false,
}: LocationInfoCardProps) {
  const searchUrl = buildMapsSearchUrl(location.latitude, location.longitude);
  const directionsUrl = buildMapsDirectionsUrl(
    location.latitude,
    location.longitude,
  );
  const source = placeDataSource(location);
  const metadata = Object.entries(location.metadata ?? {}).filter(
    ([key]) => key !== "Izvor",
  );

  useEffect(() => {
    if (escapeDisabled) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [escapeDisabled, onClose]);

  return (
    <aside
      aria-label={`${location.name} details`}
      className="map-panel-in pointer-events-auto absolute inset-x-3 bottom-3 z-30 flex max-h-[46vh] flex-col overflow-hidden rounded-3xl bg-[#fffaf3]/96 text-[#1c1917] shadow-2xl shadow-black/30 ring-1 ring-black/10 sm:inset-x-auto sm:top-24 sm:right-4 sm:bottom-4 sm:max-h-none sm:w-[22rem]"
    >
      <LocationImage
        key={location.id}
        src={location.imageUrl}
        name={location.name}
        credit={location.imageCredit}
      />
      <div className="min-h-0 flex-1 space-y-3 overflow-auto p-4">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <p className="text-xs font-medium tracking-[0.14em] text-[#c2410c] uppercase">
              {location.category}
            </p>
            <h2 className="mt-1 text-xl font-semibold tracking-tight">
              {location.name}
            </h2>
          </div>
          <Button
            variant="icon"
            className="shrink-0"
            onClick={onClose}
            aria-label="Close location details"
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
        <p className="text-sm leading-6 text-[#44403c]">{location.description}</p>
        {location.address ? (
          <p className="text-sm text-[#292524]">{location.address}</p>
        ) : null}
        <p className="font-mono text-xs text-[#78716c]">
          {location.latitude.toFixed(5)}, {location.longitude.toFixed(5)}
        </p>
        {source === "openstreetmap" ? (
          <p className="text-xs text-[#57534e]">
            <a
              className="underline decoration-[#a8a29e] underline-offset-2"
              href={OSM_COPYRIGHT_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              © OpenStreetMap contributors
            </a>
          </p>
        ) : null}
        {source === "google" ? (
          <p className="text-xs text-[#57534e]">
            Podaci o mjestu:{" "}
            <a
              className="underline decoration-[#a8a29e] underline-offset-2"
              href={GOOGLE_MAPS_URL}
              target="_blank"
              rel="noopener noreferrer"
            >
              Google
            </a>
          </p>
        ) : null}
        {metadata.length > 0 ? (
          <dl className="grid grid-cols-2 gap-x-3 gap-y-2 border-t border-black/10 pt-3 text-sm">
            {metadata.map(([key, value]) => (
              <div key={key}>
                <dt className="text-xs text-[#78716c]">
                  {formatMetadataLabel(key)}
                </dt>
                <dd className="font-medium">{String(value)}</dd>
              </div>
            ))}
          </dl>
        ) : null}
      </div>
      <div className="flex shrink-0 flex-wrap gap-2 border-t border-black/10 p-4">
          {onViewProperty ? (
            <Button onClick={onViewProperty}>
              <Images className="size-4" aria-hidden="true" />
              Look in detail
            </Button>
          ) : null}
          {directionsUrl ? (
            <a
              className="inline-flex h-10 items-center gap-2 rounded-full bg-white px-3.5 text-sm font-medium text-[#1c1917] ring-1 ring-black/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffaf3]"
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Navigation className="size-4" aria-hidden="true" />
              Directions
            </a>
          ) : null}
          {searchUrl ? (
            <a
              className="inline-flex h-10 items-center gap-2 rounded-full bg-[#1c1917] px-3.5 text-sm font-medium text-[#fffaf3] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c] focus-visible:ring-offset-2 focus-visible:ring-offset-[#fffaf3]"
              href={searchUrl}
              target="_blank"
              rel="noopener noreferrer"
            >
              <ExternalLink className="size-4" aria-hidden="true" />
              Open in Google Maps
            </a>
          ) : null}
          <Button variant="ghost" onClick={onShowOverview}>
            Back to overview
          </Button>
        </div>
    </aside>
  );
}
