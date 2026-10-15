"use client";

import { Mountain, Search, SlidersHorizontal, X } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";

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
import { MAP_PINS } from "@/features/map/data/locations";
import { useMontenegroSearch } from "@/features/map/hooks/use-montenegro-search";
import { useWorldSearch } from "@/features/map/hooks/use-world-search";
import { resolveMontenegroHit } from "@/features/map/services/montenegro-search";
import type { MapCameraController } from "@/features/map/services/map-camera-controller";
import type { CameraTarget, SupportedMapMode } from "@/features/map/types/map-camera";
import type { MapLocation } from "@/features/map/types/map-location";
import { PropertyGalleryModal } from "@/features/property-gallery/components/property-gallery-modal";
import { getPropertyByLocationId } from "@/features/property-gallery/data/properties";
import type { Property } from "@/features/property-gallery/types";
import { BuildingSceneOverlay } from "@/features/scene/components/building-scene-overlay";
import { applySelection } from "@/features/map/utils/selection";
import { getGoogleMapsApiKey } from "@/lib/env";

function useCompactHeader() {
  const [compact, setCompact] = useState(false);

  useEffect(() => {
    if (typeof window.matchMedia !== "function") {
      return;
    }

    const media = window.matchMedia("(max-width: 639px)");
    const update = () => setCompact(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  return compact;
}

const MISSING_KEY_MESSAGE =
  "Add NEXT_PUBLIC_GOOGLE_MAPS_API_KEY to .env.local, then restart the dev server. Use a browser key restricted to this site and to the Maps JavaScript API.";

const MODEL_REVEAL_DELAY_MS = 720;

function SettledPinCallout({
  location,
  onClose,
}: {
  location: MapLocation;
  onClose: () => void;
}) {
  const [placed, setPlaced] = useState(false);

  useEffect(() => {
    const frame = requestAnimationFrame(() => {
      requestAnimationFrame(() => setPlaced(true));
    });
    return () => cancelAnimationFrame(frame);
  }, [location.id]);

  return (
    <div className="pointer-events-none absolute top-[58%] left-1/2 z-30">
      <div className="pin-callout" data-placed={placed ? "true" : "false"}>
        <div className="pin-callout-stem" aria-hidden="true">
          <span className="pin-callout-line" />
        </div>
        <div className="pin-callout-card">
          <button
            type="button"
            onClick={onClose}
            className="pointer-events-auto absolute top-2 right-2 inline-flex size-7 items-center justify-center rounded-full text-[#f4efe4] transition hover:bg-white/10"
            aria-label="Zatvori"
          >
            <X className="size-4" aria-hidden="true" />
          </button>
          <p className="pr-8 text-xs font-medium tracking-[0.14em] text-[#c8d4c4] uppercase">
            {location.pinStyle === "model" ? "Zgrada" : "Lokacija"}
          </p>
          <h2 className="mt-1 pr-8 text-base font-semibold">{location.name}</h2>
          <p className="mt-1 text-sm leading-relaxed text-[#d7e0d4]">
            {location.description}
          </p>
        </div>
      </div>
    </div>
  );
}

function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

export function InteractiveMap() {
  const apiKey = getGoogleMapsApiKey();
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("Igraonice");
  const [worldSearch, setWorldSearch] = useState(WORLD_SEARCH);
  const [worldSelection, setWorldSelection] = useState<MapLocation | null>(null);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [calloutId, setCalloutId] = useState<string | null>(null);
  const [buildingOpen, setBuildingOpen] = useState(false);
  const [buildingTitle, setBuildingTitle] = useState("");
  const [sceneSession, setSceneSession] = useState(0);
  const [mode, setMode] = useState<SupportedMapMode>("SATELLITE");
  const [optionsOpen, setOptionsOpen] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const compactHeader = useCompactHeader();
  const [detailsLift, setDetailsLift] = useState<"none" | "peek" | "sheet">(
    "none",
  );
  const handlePresentationChange = useCallback(
    (presentation: "peek" | "sheet") => {
      setDetailsLift(presentation);
    },
    [],
  );
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
  const pendingLocationRef = useRef<{
    location: MapLocation;
    reveal: boolean;
  } | null>(null);
  const revealIdRef = useRef<string | null>(null);
  const revealTimerRef = useRef<number | null>(null);
  const locations = MAP_PINS;
  const calloutLocation =
    MAP_PINS.find((pin) => pin.id === calloutId) ?? null;
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

  function cancelReveal() {
    revealIdRef.current = null;
    if (revealTimerRef.current !== null) {
      window.clearTimeout(revealTimerRef.current);
      revealTimerRef.current = null;
    }
  }

  function settleFlight() {
    setFlyingTo(null);
  }

  function finishReveal() {
    setFlyingTo(null);
    const id = revealIdRef.current;
    revealIdRef.current = null;
    if (!id) {
      return;
    }

    setCalloutId(id);
    const pin = MAP_PINS.find((item) => item.id === id);
    if (pin?.pinStyle !== "model") {
      return;
    }

    const delay = prefersReducedMotion() ? 0 : MODEL_REVEAL_DELAY_MS;
    revealTimerRef.current = window.setTimeout(() => {
      revealTimerRef.current = null;
      setBuildingTitle(pin.name);
      setSceneSession((value) => value + 1);
      setBuildingOpen(true);
    }, delay);
  }

  function startFlight(location: MapLocation, reveal: boolean) {
    cancelReveal();
    setCalloutId(null);
    setBuildingOpen(false);
    revealIdRef.current = reveal ? location.id : null;

    const controller = controllerRef.current;
    if (!controller) {
      pendingLocationRef.current = { location, reveal };
      return;
    }

    pendingLocationRef.current = null;
    const animated = controller.flyToLocation(location, {
      onSettle: finishReveal,
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
      startFlight(location, true);
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
      startFlight(place, false);
    });
  }

  function selectWorldPlace(id: string) {
    const place = world.results.find((item) => item.id === id);
    if (!place) {
      return;
    }

    setSelectedId(null);
    setWorldSelection(place);
    startFlight(place, false);
  }

  function changeWorldSearch(enabled: boolean) {
    setWorldSearch(enabled);
    setQuery("");
    setWorldSelection(null);
  }

  function clearSelection() {
    cancelReveal();
    setCalloutId(null);
    setBuildingOpen(false);
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

    cancelReveal();
    setCalloutId(null);
    setBuildingOpen(false);
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
              revealIdRef.current = pending.reveal ? pending.location.id : null;
              const animated = controller.flyToLocation(pending.location, {
                onSettle: finishReveal,
              });
              setFlyingTo(animated ? pending.location.name : null);
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
              <div className="flex items-center gap-2 sm:contents">
                <Button
                  variant="icon"
                  className="sm:hidden"
                  aria-label={searchOpen ? "Zatvori pretragu" : "Otvori pretragu"}
                  aria-expanded={searchOpen}
                  aria-controls="map-search"
                  onClick={() => setSearchOpen((open) => !open)}
                >
                  {searchOpen ? (
                    <X className="size-4" aria-hidden="true" />
                  ) : (
                    <Search className="size-4" aria-hidden="true" />
                  )}
                </Button>
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
            </div>
            <div
              id="map-search"
              className="map-search-slot sm:contents"
              data-open={searchOpen ? "true" : "false"}
              inert={compactHeader && !searchOpen ? true : undefined}
            >
              <div className="map-search-panel sm:contents">
                <MapSearch
                  query={query}
                  onQueryChange={setQuery}
                  category={category}
                  onCategoryChange={setCategory}
                  results={search.results}
                  selectedId={worldSelection?.id ?? selectedId}
                  onSelect={(id) => {
                    if (compactHeader) {
                      setSearchOpen(false);
                    }
                    if (worldSearch) {
                      selectWorldPlace(id);
                      return;
                    }
                    selectMontenegroPlace(id);
                  }}
                  worldSearch={worldSearch}
                  montenegroSearch={!worldSearch}
                  onWorldSearchChange={changeWorldSearch}
                  worldStatus={search.status}
                  worldMessage={search.message}
                  requestFocus={searchOpen}
                />
              </div>
            </div>
          </div>
        </header>

        {flyingTo ? (
          <p
            className="pointer-events-none absolute top-[5.5rem] left-1/2 -translate-x-1/2 rounded-full bg-[#121612]/80 px-3 py-1 text-xs tracking-wide text-[#f5f5f4] sm:top-24"
            role="status"
          >
            Flying to {flyingTo}
          </p>
        ) : null}

        {calloutLocation ? (
          <SettledPinCallout
            key={calloutLocation.id}
            location={calloutLocation}
            onClose={() => {
              cancelReveal();
              setCalloutId(null);
            }}
          />
        ) : null}

        <MapControls
          ready={phase === "ready"}
          hasSelection={cardLocation !== null}
          mode={mode}
          optionsOpen={optionsOpen}
          lift={worldSelection ? detailsLift : "none"}
          onShowOverview={showOverview}
          onRecenter={recenter}
          onModeChange={setMode}
          onNudgeHeading={nudgeHeading}
        />

        {worldSelection ? (
          <LocationInfoCard
            key={worldSelection.id}
            location={worldSelection}
            onClose={clearSelection}
            onShowOverview={showOverview}
            onViewProperty={openGallery}
            onPresentationChange={handlePresentationChange}
            escapeDisabled={galleryProperty !== null}
          />
        ) : null}
      </div>
      {galleryProperty ? (
        <PropertyGalleryModal property={galleryProperty} onClose={closeGallery} />
      ) : null}
      <BuildingSceneOverlay
        open={buildingOpen}
        session={sceneSession}
        title={buildingTitle}
        onClose={() => setBuildingOpen(false)}
      />
    </div>
  );
}
