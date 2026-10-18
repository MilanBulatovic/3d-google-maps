import {
  Compass,
  LocateFixed,
  RotateCcw,
  RotateCw,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import { HEADING_STEP_DEGREES } from "@/features/map/config/camera";
import type { SupportedMapMode } from "@/features/map/types/map-camera";
import { cn } from "@/lib/utils";

type MapControlsProps = {
  ready: boolean;
  hasSelection: boolean;
  mode: SupportedMapMode;
  optionsOpen: boolean;
  lift: "none" | "peek" | "sheet";
  onShowOverview: () => void;
  onRecenter: () => void;
  onModeChange: (mode: SupportedMapMode) => void;
  onNudgeHeading: (delta: number) => void;
};

export function MapControls({
  ready,
  hasSelection,
  mode,
  optionsOpen,
  lift,
  onShowOverview,
  onRecenter,
  onModeChange,
  onNudgeHeading,
}: MapControlsProps) {
  return (
    <div
      id="map-controls"
      className={cn(
        "pointer-events-auto absolute left-3 z-20 flex flex-col items-start gap-2 sm:bottom-4 sm:left-4",
        lift === "sheet" && "bottom-[min(48vh,20rem)]",
        lift === "peek" && "bottom-24",
        lift === "none" && "bottom-4",
      )}
    >
      <div className="flex gap-2">
        <Button
          variant="ghost"
          disabled={!ready}
          onClick={onShowOverview}
        >
          <Compass className="size-4" aria-hidden="true" />
          Overview
        </Button>
        <Button
          variant="ghost"
          disabled={!ready || !hasSelection}
          onClick={onRecenter}
        >
          <LocateFixed className="size-4" aria-hidden="true" />
          Recenter
        </Button>
      </div>
      {optionsOpen ? (
        <div className="flex flex-col gap-2 rounded-2xl bg-[#fffaf3]/95 p-2 shadow-lg shadow-black/20 ring-1 ring-black/10">
          <div className="flex gap-1" role="group" aria-label="Map mode">
            <Button
              variant={mode === "SATELLITE" ? "solid" : "ghost"}
              aria-pressed={mode === "SATELLITE"}
              disabled={!ready}
              onClick={() => onModeChange("SATELLITE")}
            >
              Satellite
            </Button>
            <Button
              variant={mode === "HYBRID" ? "solid" : "ghost"}
              aria-pressed={mode === "HYBRID"}
              disabled={!ready}
              onClick={() => onModeChange("HYBRID")}
            >
              Hybrid
            </Button>
          </div>
          <div className="flex gap-1" role="group" aria-label="Camera heading">
            <Button
              variant="icon"
              disabled={!ready}
              aria-label="Rotate heading left"
              onClick={() => onNudgeHeading(-HEADING_STEP_DEGREES)}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
            </Button>
            <Button
              variant="icon"
              disabled={!ready}
              aria-label="Rotate heading right"
              onClick={() => onNudgeHeading(HEADING_STEP_DEGREES)}
            >
              <RotateCw className="size-4" aria-hidden="true" />
            </Button>
          </div>
        </div>
      ) : null}
    </div>
  );
}
