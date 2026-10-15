"use client";

import { useEffect, useRef, useState } from "react";

import { PODGORICA_OVERVIEW } from "@/features/map/config/camera";
import { useGoogleMaps3d } from "@/features/map/hooks/use-google-maps-3d";
import {
  applyMarkerAppearance,
  createLocationMarker,
  removeLocationMarker,
  type MarkerRecord,
} from "@/features/map/components/location-marker";
import {
  createCameraMap,
  MapCameraController,
} from "@/features/map/services/map-camera-controller";
import type { MapLocation } from "@/features/map/types/map-location";
import type { SupportedMapMode } from "@/features/map/types/map-camera";

export type MapFailure = {
  kind: "load" | "init";
  message: string;
};

type MapCanvasProps = {
  apiKey: string;
  locations: readonly MapLocation[];
  selectedId: string | null;
  mode: SupportedMapMode;
  onSelect: (id: string) => void;
  onReady: (controller: MapCameraController) => void;
  onUnavailable: () => void;
  onError: (failure: MapFailure) => void;
};

export function MapCanvas({
  apiKey,
  locations,
  selectedId,
  mode,
  onSelect,
  onReady,
  onUnavailable,
  onError,
}: MapCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<google.maps.maps3d.Map3DElement | null>(null);
  const markersRef = useRef<Map<string, MarkerRecord>>(new Map());
  const onSelectRef = useRef(onSelect);
  const onReadyRef = useRef(onReady);
  const onUnavailableRef = useRef(onUnavailable);
  const onErrorRef = useRef(onError);
  const modeRef = useRef(mode);
  const selectedIdRef = useRef(selectedId);
  const [imageryReady, setImageryReady] = useState(false);
  const { runtime, error } = useGoogleMaps3d(apiKey);

  useEffect(() => {
    onSelectRef.current = onSelect;
    onReadyRef.current = onReady;
    onUnavailableRef.current = onUnavailable;
    onErrorRef.current = onError;
    modeRef.current = mode;
    selectedIdRef.current = selectedId;
  }, [mode, onError, onReady, onSelect, onUnavailable, selectedId]);

  useEffect(() => {
    if (error) {
      onErrorRef.current({ kind: "load", message: error });
    }
  }, [error]);

  useEffect(() => {
    if (!runtime || !containerRef.current) {
      return;
    }

    let disposed = false;
    const map = new runtime.Map3DElement({
      center: PODGORICA_OVERVIEW.center,
      range: PODGORICA_OVERVIEW.range,
      tilt: PODGORICA_OVERVIEW.tilt,
      heading: PODGORICA_OVERVIEW.heading,
      roll: PODGORICA_OVERVIEW.roll,
      mode: modeRef.current,
      gestureHandling: "GREEDY",
      defaultUIHidden: true,
      description: "Photorealistic 3D map of Montenegro",
    });
    map.className = "google-map-3d";
    containerRef.current.append(map);
    mapRef.current = map;

    const controller = new MapCameraController(createCameraMap(map));

    const handleInitError = () => {
      if (!disposed) {
        onErrorRef.current({
          kind: "init",
          message:
            "The 3D map failed to initialize. Confirm that billing is enabled, the Maps JavaScript API is turned on, and this site is an allowed referrer for the API key.",
        });
      }
    };

    const handleSteady = (event: Event) => {
      if (
        "isSteady" in event &&
        event.isSteady === true &&
        !disposed
      ) {
        setImageryReady(true);
      }
    };

    map.addEventListener("gmp-error", handleInitError);
    map.addEventListener("gmp-steadychange", handleSteady);
    onReadyRef.current(controller);

    return () => {
      disposed = true;
      controller.dispose();
      onUnavailableRef.current();
      for (const record of markersRef.current.values()) {
        removeLocationMarker(record);
      }
      markersRef.current = new Map();
      map.removeEventListener("gmp-error", handleInitError);
      map.removeEventListener("gmp-steadychange", handleSteady);
      map.remove();
      mapRef.current = null;
    };
  }, [runtime]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map || !runtime) {
      return;
    }

    const nextIds = new Set(locations.map((location) => location.id));
    for (const [id, record] of markersRef.current) {
      if (!nextIds.has(id)) {
        removeLocationMarker(record);
        markersRef.current.delete(id);
      }
    }

    for (const location of locations) {
      if (markersRef.current.has(location.id)) {
        continue;
      }

      const record = createLocationMarker(location, runtime, (id) => {
        onSelectRef.current(id);
      });
      map.append(record.marker);
      markersRef.current.set(location.id, record);
    }

    for (const [id, record] of markersRef.current) {
      applyMarkerAppearance(record, id === selectedIdRef.current);
    }
  }, [locations, runtime]);

  useEffect(() => {
    const map = mapRef.current;
    if (!map) {
      return;
    }

    map.mode = mode;
  }, [mode]);

  useEffect(() => {
    for (const [id, record] of markersRef.current) {
      applyMarkerAppearance(record, id === selectedId);
    }
  }, [selectedId]);

  return (
    <div className="absolute inset-0" ref={containerRef}>
      {imageryReady ? null : (
        <p
          className="pointer-events-none absolute top-28 left-1/2 z-10 -translate-x-1/2 rounded-full bg-[#121612]/75 px-3 py-1 text-xs tracking-wide text-[#e7e5e4]"
          role="status"
        >
          Preparing 3D imagery
        </p>
      )}
    </div>
  );
}
