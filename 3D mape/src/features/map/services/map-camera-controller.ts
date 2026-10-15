import { CAMERA_TIMING, MONTENEGRO_OVERVIEW } from "@/features/map/config/camera";
import type {
  CameraAltitudeMode,
  CameraMap,
  CameraTarget,
} from "@/features/map/types/map-camera";
import {
  buildLocationFlight,
  normalizeHeading,
  type FlightPoint,
} from "@/features/map/utils/camera-flight";

export type FlightHandlers = {
  onSettle?: () => void;
};

function prefersReducedMotion(): boolean {
  if (typeof window.matchMedia !== "function") {
    return false;
  }

  return window.matchMedia("(prefers-reduced-motion: reduce)").matches;
}

function withAltitudeMode(target: CameraTarget): CameraTarget & {
  altitudeMode: CameraAltitudeMode;
} {
  return { ...target, altitudeMode: target.altitudeMode ?? "ABSOLUTE" };
}

export function createCameraMap(
  map: google.maps.maps3d.Map3DElement,
): CameraMap {
  return {
    flyCameraTo: (options) => {
      map.flyCameraTo(options);
    },
    stopCameraAnimation: () => {
      map.stopCameraAnimation();
    },
    addEventListener: (type, listener) => {
      map.addEventListener(type, listener);
    },
    removeEventListener: (type, listener) => {
      map.removeEventListener(type, listener);
    },
    get center() {
      const center = map.center;
      if (!center) {
        return null;
      }

      return { lat: center.lat, lng: center.lng, altitude: center.altitude };
    },
    get range() {
      return map.range;
    },
    get tilt() {
      return map.tilt;
    },
    get heading() {
      return map.heading;
    },
    get roll() {
      return map.roll;
    },
  };
}

/**
 * Native flyCameraTo sequences.
 * A newer call increments a generation token and stopCameraAnimation() so the previous flight cannot continue.
 */
export class MapCameraController {
  private generation = 0;
  private listener: ((event: Event) => void) | null = null;
  private fallbackTimer: ReturnType<typeof setTimeout> | null = null;

  constructor(private readonly map: CameraMap) {}

  /** Two-step flight: a side approach, then an angled bird's-eye. Returns whether the move is animated. */
  flyToLocation(point: FlightPoint, handlers: FlightHandlers = {}): boolean {
    const flight = buildLocationFlight(point);
    const reducedMotion = prefersReducedMotion();

    if (reducedMotion) {
      this.flyOnce(flight.birdsEye, 0, handlers);
      return false;
    }

    const token = this.begin();
    let phase: "approach" | "birdsEye" = "approach";
    let acceptEvents = false;

    const advance = () => {
      if (token !== this.generation) {
        return;
      }

      this.clearFallback();

      if (phase === "approach") {
        phase = "birdsEye";
        this.map.flyCameraTo({
          endCamera: withAltitudeMode(flight.birdsEye),
          durationMillis: CAMERA_TIMING.birdsEyeMillis,
        });
        this.armFallback(CAMERA_TIMING.birdsEyeMillis, advance);
        return;
      }

      this.detach();
      handlers.onSettle?.();
    };

    const listener = () => {
      if (!acceptEvents || token !== this.generation) {
        return;
      }

      advance();
    };

    this.listener = listener;
    this.map.addEventListener("gmp-animationend", listener);
    this.map.flyCameraTo({
      endCamera: withAltitudeMode(flight.approach),
      durationMillis: CAMERA_TIMING.approachMillis,
    });
    this.armFallback(CAMERA_TIMING.approachMillis, advance);

    queueMicrotask(() => {
      if (token === this.generation) {
        acceptEvents = true;
      }
    });

    return true;
  }

  showOverview(handlers: FlightHandlers = {}): boolean {
    return this.flyOnce(
      MONTENEGRO_OVERVIEW,
      prefersReducedMotion() ? 0 : CAMERA_TIMING.overviewMillis,
      handlers,
    );
  }

  recenter(point: FlightPoint, handlers: FlightHandlers = {}): boolean {
    return this.flyOnce(
      buildLocationFlight(point).birdsEye,
      prefersReducedMotion() ? 0 : CAMERA_TIMING.recenterMillis,
      handlers,
    );
  }

  captureCamera(): CameraTarget | null {
    const center = this.map.center;
    const range = this.map.range;
    const tilt = this.map.tilt;
    const heading = this.map.heading;

    if (center == null || range == null || tilt == null || heading == null) {
      return null;
    }

    return {
      center,
      range,
      tilt,
      heading,
      roll: this.map.roll ?? 0,
    };
  }

  restoreCamera(target: CameraTarget, handlers: FlightHandlers = {}): boolean {
    return this.flyOnce(
      target,
      prefersReducedMotion() ? 0 : CAMERA_TIMING.recenterMillis,
      handlers,
    );
  }

  nudgeHeading(deltaDegrees: number, handlers: FlightHandlers = {}): boolean {
    const center = this.map.center ?? MONTENEGRO_OVERVIEW.center;
    const target: CameraTarget = {
      center,
      range: this.map.range ?? MONTENEGRO_OVERVIEW.range,
      tilt: this.map.tilt ?? MONTENEGRO_OVERVIEW.tilt,
      heading: normalizeHeading((this.map.heading ?? 0) + deltaDegrees),
      roll: this.map.roll ?? 0,
    };

    return this.flyOnce(
      target,
      prefersReducedMotion() ? 0 : CAMERA_TIMING.headingMillis,
      handlers,
    );
  }

  dispose(): void {
    this.generation += 1;
    this.detach();
    this.clearFallback();
  }

  private flyOnce(
    target: CameraTarget,
    durationMillis: number,
    handlers: FlightHandlers,
  ): boolean {
    const token = this.begin();
    const animated = durationMillis > 0;

    if (!animated) {
      this.map.flyCameraTo({
        endCamera: withAltitudeMode(target),
        durationMillis: 0,
      });
      handlers.onSettle?.();
      return false;
    }

    let acceptEvents = false;
    const listener = () => {
      if (!acceptEvents || token !== this.generation) {
        return;
      }

      this.detach();
      handlers.onSettle?.();
    };

    this.listener = listener;
    this.map.addEventListener("gmp-animationend", listener);
    this.map.flyCameraTo({
      endCamera: withAltitudeMode(target),
      durationMillis,
    });

    queueMicrotask(() => {
      if (token === this.generation) {
        acceptEvents = true;
      }
    });

    return true;
  }

  private begin(): number {
    this.generation += 1;
    this.detach();
    this.clearFallback();
    this.map.stopCameraAnimation();
    return this.generation;
  }

  private armFallback(durationMillis: number, advance: () => void) {
    this.clearFallback();
    this.fallbackTimer = setTimeout(advance, durationMillis + 400);
  }

  private clearFallback() {
    if (this.fallbackTimer == null) {
      return;
    }

    clearTimeout(this.fallbackTimer);
    this.fallbackTimer = null;
  }

  private detach(): void {
    if (!this.listener) {
      return;
    }

    this.map.removeEventListener("gmp-animationend", this.listener);
    this.listener = null;
  }
}
