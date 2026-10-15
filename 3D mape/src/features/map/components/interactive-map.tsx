"use client";

import { Mountain, SlidersHorizontal } from "lucide-react";
import { useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { LocationInfoCard } from "@/features/map/components/location-info-card";
import {
  MapCanvas,
  type MapFailure,
} from "@/features/map/components/map-canvas";
import { MapControls } from "@/features/map/components/map-controls";
import { MapError } from "@/features/map/components/map-error";
import { MapLoading } from "@/features/map/components/map-loading";
import { MapSearch } from "@/features/map/components/map-search";
import { WORLD_SEARCH } from "@/features/map/config/search";
import { useMapLocations } from "@/features/map/hooks/use-map-locations";
import { useMontenegroSearch } from "@/features/map/hooks/use-montenegro-search";
import { useWorldSearch } from "@/features/map/hooks/use-world-search";
import { resolveMontenegroHit } from "@/features/map/services/montenegro-search";
import type { MapCameraController } from "@/features/map/services/map-camera-controller";
import type { CameraTarget, SupportedMapMode } from "@/features/map/types/map-camera";
import type { MapLocation } from "@/features/map/types/map-location";
import { PropertyGalleryModal } from "@/features/property-gallery/components/property-gallery-modal";
import { getPropertyByLocationId } from "@/features/property-gallery/data/properties";
import type { Property } from "@/features/property-gallery/types";
import { applySelection } from "@/features/map/utils/selection";
import { getGoogleMapsApiKey } from "@/lib/env";

const MISSING_KEY_MESSAGE =
  "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local, then restart the dev server. Use a browser key restricted to this site and to the Maps JavaScript API.";

export function InteractiveMap() {
  const apiKey = getGoogleMapsApiKey();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("all");
  const [worldSearch, setWorldSearch] = useState(WORLD_SEARCH);
  const [worldSelection, setWorldSelection] = useState<MapLocation | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<SupportedMapMode>("SATELLITE");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [attempt, setAttempt] = useState(0);
  const [phase, setPhase] = useState<"loading" | "ready" | "error">(
    apiKey ? "loading" : "error",
  );
  const [failure, setFailure] = useState<MapFailure | null>(
    apiKey
      ? null
      : { kind: "load", message: MISSING_KEY_MESSAGE },
  );
  const [flyingTo, setFlyingTo] = useState<string | null>(null);
  const [galleryProperty, setGalleryProperty] = useState<Property | null>(null);
  const controllerRef = useRef<MapCameraController | null>(null);
  const galleryCameraRef = useRef<CameraTarget | null>(null);
  const pendingLocationRef = useRef<MapLocation | null>(null);
  const { locations, categories, placesSource } = useMapLocations("", category);
  const montenegro = useMontenegroSearch(query, !worldSearch, apiKey);
  const world = useWorldSearch(query, worldSearch, apiKey);
  const search = worldSearch ? world : montenegro;
  const locationIds = locations.map((location) => location.id);
  const selected = locations.find((location) => location.id === selectedId) ?? null;
  const cardLocation = worldSelection ?? selected;
  function openGallery() {
    if (!cardLocation) {
      return;
    }

    const listing = getPropertyByLocationId(cardLocation.id);
    galleryCameraRef.current = controllerRef.current?.captureCamera() ?? null;
    setGalleryProperty(
      listing ?? {
        id: cardLocation.id,
        locationId: cardLocation.id,
        title: cardLocation.name,
        location: cardLocation.address ?? cardLocation.category,
        images: cardLocation.imageUrl
          ? [
              {
                id: `${cardLocation.id}-photo`,
                src: cardLocation.imageUrl,
                alt: cardLocation.name,
                credit: cardLocation.imageCredit,
              },
            ]
          : [],
      },
    );
  }

  function closeGallery() {
    const snapshot = galleryCameraRef.current;
    galleryCameraRef.current = null;
    setGalleryProperty(null);

    if (snapshot) {
      controllerRef.current?.restoreCamera(snapshot);
    }
  }

  function settleFlight() {
    setFlyingTo(null);
  }

  function startFlight(location: MapLocation) {
    const controller = controllerRef.current;
    if (!controller) {
      pendingLocationRef.current = location;
      return;
    }

    pendingLocationRef.current = null;
    const animated = controller.flyToLocation(location, {
      onSettle: settleFlight,
    });
    setFlyingTo(animated ? location.name : null);
  }

  function selectLocation(id: string) {
    setWorldSelection(null);
    const nextId = applySelection(selectedId, { type: "select", id }, locationIds);
    if (nextId !== id) {
      return;
    }

    setSelectedId(nextId);
    const location = locations.find((item) => item.id === id);
    if (location) {
      startFlight(location);
    }
  }

  function selectMontenegroPlace(id: string) {
    const hit = montenegro.results.find((item) => item.id === id);
    if (!hit || !apiKey) {
      return;
    }

    setSelectedId(null);
    void resolveMontenegroHit(apiKey, hit).then((place) => {
      setWorldSelection(place);
      startFlight(place);
    });
  }

  function selectWorldPlace(id: string) {
    const place = world.results.find((item) => item.id === id);
    if (!place) {
      return;
    }

    setSelectedId(null);
    setWorldSelection(place);
    startFlight(place);
  }

  function changeWorldSearch(enabled: boolean) {
    setWorldSearch(enabled);
    setQuery("");
    setWorldSelection(null);
  }

  function clearSelection() {
    setWorldSelection(null);
    setGalleryProperty(null);
    galleryCameraRef.current = null;
    setSelectedId(applySelection(selectedId, { type: "clear" }, locationIds));
  }

  function showOverview() {
    const controller = controllerRef.current;
    if (!controller) {
      return;
    }

    setWorldSelection(null);
    const animated = controller.showOverview({ onSettle: settleFlight });
    setFlyingTo(animated ? "Crna Gora" : null);
  }

  function recenter() {
    const controller = controllerRef.current;
    if (!controller || !cardLocation) {
      return;
    }

    const animated = controller.recenter(cardLocation, { onSettle: settleFlight });
    setFlyingTo(animated ? cardLocation.name : null);
  }

  function nudgeHeading(delta: number) {
    const controller = controllerRef.current;
    if (!controller) {
      return;
    }

    controller.nudgeHeading(delta, { onSettle: settleFlight });
  }

  function retry() {
    if (!getGoogleMapsApiKey()) {
      setFailure({ kind: "load", message: MISSING_KEY_MESSAGE });
      setPhase("error");
      return;
    }

    setFailure(null);
    setPhase("loading");
    setAttempt((value) => value + 1);
  }

  const missingKey = !apiKey;
  const errorTitle = missingKey
    ? "Google Maps API key required"
    : failure?.kind === "init"
      ? "3D map unavailable"
      : "Map could not be loaded";

  return (
    <div className="relative h-dvh w-full overflow-hidden bg-[#121612]">
      {apiKey && phase !== "error" ? (
        <MapCanvas
          key={attempt}
          apiKey={apiKey}
          locations={locations}
          selectedId={selectedId}
          mode={mode}
          onSelect={selectLocation}
          onReady={(controller) => {
            controllerRef.current = controller;
            setPhase("ready");
            const pending = pendingLocationRef.current;
            if (pending) {
              pendingLocationRef.current = null;
              const animated = controller.flyToLocation(pending, {
                onSettle: settleFlight,
              });
              setFlyingTo(animated ? pending.name : null);
            }
          }}
          onUnavailable={() => {
            controllerRef.current = null;
          }}
          onError={(nextFailure) => {
            setFailure(nextFailure);
            setPhase("error");
            setFlyingTo(null);
          }}
        />
      ) : null}

      {phase === "loading" && apiKey ? <MapLoading /> : null}
      {phase === "error" ? (
        <MapError
          title={errorTitle}
          message={failure?.message ?? MISSING_KEY_MESSAGE}
          onRetry={retry}
        />
      ) : null}

      <div className="pointer-events-none absolute inset-0 z-20">
        <header className="pointer-events-none absolute inset-x-0 top-0 p-3 sm:p-4">
          <div className="pointer-events-auto mx-auto flex max-w-5xl flex-col gap-2 rounded-3xl bg-[#fffaf3]/55 p-2 shadow-lg shadow-black/20 ring-1 ring-white/40 backdrop-blur-sm sm:flex-row sm:items-center">
            <div className="flex items-center justify-between gap-2 sm:contents">
              <div className="flex items-center gap-2 px-2">
                <span className="flex size-9 items-center justify-center rounded-full bg-[#1c1917] text-[#fffaf3]">
                  <Mountain className="size-4" aria-hidden="true" />
                </span>
                <div className="leading-tight">
                  <h1 className="text-sm font-semibold tracking-tight text-[#1c1917]">
                    Crna Gora
                  </h1>
                  <p className="text-[11px] tracking-[0.16em] text-[#78716c] uppercase">
                    3D mapa
                  </p>
                </div>
              </div>
              <Button
                variant="icon"
                className="sm:order-last"
                aria-label="Map options"
                aria-expanded={optionsOpen}
                aria-controls="map-controls"
                onClick={() => setOptionsOpen((open) => !open)}
              >
                <SlidersHorizontal className="size-4" aria-hidden="true" />
              </Button>
            </div>
            <MapSearch
              query={query}
              onQueryChange={setQuery}
              category={category}
              categories={categories}
              onCategoryChange={setCategory}
              results={search.results}
              selectedId={worldSelection?.id ?? selectedId}
              onSelect={worldSearch ? selectWorldPlace : selectMontenegroPlace}
              worldSearch={worldSearch}
              montenegroSearch={!worldSearch}
              onWorldSearchChange={changeWorldSearch}
              worldStatus={search.status}
              worldMessage={search.message}
            />
          </div>
        </header>

        {flyingTo ? (
          <p
            className="pointer-events-none absolute top-[5.5rem] left-1/2 -translate-x-1/2 rounded-full bg-[#121612]/80 px-3 py-1 text-xs tracking-wide text-[#f5f5f4] sm:top-24"
            role="status"
          >
            Flying to {flyingTo}
          </p>
        ) : placesSource === "loading" ? (
          <p
            className="pointer-events-none absolute top-[5.5rem] left-1/2 -translate-x-1/2 rounded-full bg-[#121612]/80 px-3 py-1 text-xs tracking-wide text-[#f5f5f4] sm:top-24"
            role="status"
          >
            Loading places from OpenStreetMap
          </p>
        ) : null}

        <MapControls
          ready={phase === "ready"}
          hasSelection={cardLocation !== null}
          mode={mode}
          optionsOpen={optionsOpen}
          raised={cardLocation !== null}
          onShowOverview={showOverview}
          onRecenter={recenter}
          onModeChange={setMode}
          onNudgeHeading={nudgeHeading}
        />

        {cardLocation ? (
          <LocationInfoCard
            key={cardLocation.id}
            location={cardLocation}
            onClose={clearSelection}
            onShowOverview={showOverview}
            onViewProperty={openGallery}
            escapeDisabled={galleryProperty !== null}
          />
        ) : null}
      </div>
      {galleryProperty ? (
        <PropertyGalleryModal property={galleryProperty} onClose={closeGallery} />
      ) : null}
    </div>
  );
}
