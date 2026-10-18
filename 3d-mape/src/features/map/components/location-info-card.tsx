"use client";

import { ChevronUp, ExternalLink, Images, MapPin, Navigation, X } from "lucide-react";
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

const MOBILE_QUERY = "(max-width: 639px)";

type LocationInfoCardProps = {
  location: MapLocation;
  onClose: () => void;
  onShowOverview: () => void;
  onViewProperty?: () => void;
  onPresentationChange?: (presentation: "peek" | "sheet") => void;
  escapeDisabled?: boolean;
};

function useMobileLayout() {
  const [mobile, setMobile] = useState(() => {
    if (typeof window === "undefined" || typeof window.matchMedia !== "function") {
      return false;
    }

    return window.matchMedia(MOBILE_QUERY).matches;
  });

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const media = window.matchMedia(MOBILE_QUERY);
    const update = () => setMobile(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return mobile;
}

function formatMetadataLabel(key: string): string {
  const spaced = key.replace(/([A-Z])/g, " $1");
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}

function MetadataValue({ label, value }: { label: string; value: string }) {
  if (label === "Telefon") {
    return (
      <a
        className="underline decoration-[#a8a29e] underline-offset-2"
        href={`tel:${value.replace(/\s/g, "")}`}
      >
        {value}
      </a>
    );
  }

  if (label === "E-mail") {
    return (
      <a
        className="underline decoration-[#a8a29e] underline-offset-2"
        href={`mailto:${value}`}
      >
        {value}
      </a>
    );
  }

  return value;
}

function LocationImage({
  src,
  credit,
  onFail,
}: {
  src: string;
  credit?: ImageCredit;
  onFail: () => void;
}) {
  return (
    <div className="relative h-36 shrink-0 bg-[#e7e5e4] sm:h-44">
      <Image
        src={src}
        alt=""
        fill
        sizes="(min-width: 768px) 22rem, 100vw"
        className="object-cover"
        onError={onFail}
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
  onPresentationChange,
  escapeDisabled = false,
}: LocationInfoCardProps) {
  const mobile = useMobileLayout();
  const [expanded, setExpanded] = useState(!mobile);
  const [photoFailed, setPhotoFailed] = useState(false);
  const showPhoto = Boolean(location.imageUrl) && !photoFailed;
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
    setExpanded(!mobile);
  }, [mobile]);

  function dismiss() {
    if (mobile) {
      setExpanded(false);
      return;
    }

    onClose();
  }

  useEffect(() => {
    onPresentationChange?.(mobile && !expanded ? "peek" : "sheet");
  }, [expanded, mobile, onPresentationChange]);

  useEffect(() => {
    if (escapeDisabled) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        if (mobile && expanded) {
          setExpanded(false);
          return;
        }

        onClose();
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [escapeDisabled, expanded, mobile, onClose]);

  if (mobile && !expanded) {
    return (
      <div className="map-panel-in pointer-events-auto absolute inset-x-3 bottom-3 z-30 flex items-center gap-2 rounded-full bg-[#fffaf3]/96 py-1.5 pr-1.5 pl-1.5 text-[#1c1917] shadow-2xl shadow-black/30 ring-1 ring-black/10">
        <button
          type="button"
          className="flex min-w-0 flex-1 items-center gap-2.5 rounded-full text-left focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#c2410c]"
          onClick={() => setExpanded(true)}
          aria-expanded={false}
          aria-label={`Show details for ${location.name}`}
        >
          <span className="relative size-11 shrink-0 overflow-hidden rounded-full bg-[#e7e5e4]">
            {location.imageUrl ? (
              <Image
                src={location.imageUrl}
                alt=""
                fill
                sizes="44px"
                className="object-cover"
              />
            ) : (
              <span className="flex size-full items-center justify-center text-[#57534e]">
                <MapPin className="size-4" aria-hidden="true" />
              </span>
            )}
          </span>
          <span className="min-w-0 flex-1">
            <span className="block text-[0.65rem] font-medium tracking-[0.14em] text-[#c2410c] uppercase">
              {location.category}
            </span>
            <span className="block truncate text-sm font-semibold">
              {location.name}
            </span>
          </span>
          <ChevronUp className="size-4 shrink-0 text-[#78716c]" aria-hidden="true" />
        </button>
        <Button
          variant="icon"
          className="size-9 shrink-0"
          onClick={onClose}
          aria-label="Close location details"
        >
          <X className="size-4" aria-hidden="true" />
        </Button>
      </div>
    );
  }

  return (
    <aside
      aria-label={`${location.name} details`}
      className="map-panel-in pointer-events-auto absolute inset-x-3 bottom-3 z-30 flex h-auto max-h-[46vh] flex-col overflow-hidden rounded-3xl bg-[#fffaf3]/96 text-[#1c1917] shadow-2xl shadow-black/30 ring-1 ring-black/10 sm:inset-x-auto sm:top-24 sm:right-4 sm:bottom-auto sm:max-h-[calc(100dvh-8rem)] sm:w-[22rem]"
    >
      {showPhoto && location.imageUrl ? (
        <div className="relative shrink-0">
          <LocationImage
            key={location.id}
            src={location.imageUrl}
            credit={location.imageCredit}
            onFail={() => setPhotoFailed(true)}
          />
          <Button
            variant="icon"
            className="absolute top-2 right-2 z-10 bg-white/90"
            onClick={dismiss}
            aria-label={mobile ? "Hide location details" : "Close location details"}
          >
            <X className="size-4" aria-hidden="true" />
          </Button>
        </div>
      ) : null}
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
          {showPhoto ? null : (
            <Button
              variant="icon"
              className="shrink-0 bg-white/90"
              onClick={dismiss}
              aria-label={mobile ? "Hide location details" : "Close location details"}
            >
              <X className="size-4" aria-hidden="true" />
            </Button>
          )}
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
          <dl className="space-y-2 border-t border-black/10 pt-3 text-sm">
            {metadata.map(([key, value]) => {
              const label = formatMetadataLabel(key);
              return (
                <div
                  key={key}
                  className="grid grid-cols-[6.75rem_minmax(0,1fr)] items-baseline gap-x-3"
                >
                  <dt className="text-xs text-[#78716c]">{label}</dt>
                  <dd className="font-medium break-words">
                    <MetadataValue label={label} value={String(value)} />
                  </dd>
                </div>
              );
            })}
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
