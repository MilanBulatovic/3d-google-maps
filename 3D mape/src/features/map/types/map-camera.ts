export type CameraAltitudeMode = "ABSOLUTE" | "RELATIVE_TO_GROUND";

export type CameraTarget = {
  center: {
    lat: number;
    lng: number;
    altitude: number;
  };
  range: number;
  tilt: number;
  heading: number;
  roll: number;
  /** Absolute is meters above sea level. Relative is meters above the ground at that coordinate. */
  altitudeMode?: CameraAltitudeMode;
};

export type SupportedMapMode = "SATELLITE" | "HYBRID";

/**
 * Narrow surface used by the camera controller.
 * Map3DElement is adapted to this so tests can supply a fake without the API.
 */
export type CameraMap = {
  flyCameraTo(options: {
    endCamera: CameraTarget & { altitudeMode: CameraAltitudeMode };
    durationMillis?: number;
  }): void;
  stopCameraAnimation(): void;
  addEventListener(
    type: "gmp-animationend",
    listener: (event: Event) => void,
  ): void;
  removeEventListener(
    type: "gmp-animationend",
    listener: (event: Event) => void,
  ): void;
  readonly center: { lat: number; lng: number; altitude: number } | null;
  readonly range: number | null;
  readonly tilt: number | null;
  readonly heading: number | null;
  readonly roll: number | null;
};
