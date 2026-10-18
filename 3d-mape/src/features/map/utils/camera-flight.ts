import {
  APPROACH_CAMERA,
  BIRDS_EYE_CAMERA,
} from "@/features/map/config/camera";
import type { CameraTarget } from "@/features/map/types/map-camera";

export type FlightPoint = {
  latitude: number;
  longitude: number;
  altitude?: number;
  viewRange?: number;
  viewTilt?: number;
};

export type LocationFlight = {
  approach: CameraTarget;
  birdsEye: CameraTarget;
};

export function normalizeHeading(degrees: number): number {
  const wrapped = degrees % 360;
  return wrapped < 0 ? wrapped + 360 : wrapped;
}

function cameraCenter(point: FlightPoint): Pick<CameraTarget, "center" | "altitudeMode"> {
  if (point.altitude != null) {
    return {
      center: {
        lat: point.latitude,
        lng: point.longitude,
        altitude: point.altitude,
      },
      altitudeMode: "ABSOLUTE",
    };
  }

  return {
    center: {
      lat: point.latitude,
      lng: point.longitude,
      altitude: 0,
    },
    altitudeMode: "RELATIVE_TO_GROUND",
  };
}

export function buildLocationFlight(point: FlightPoint): LocationFlight {
  const { center, altitudeMode } = cameraCenter(point);

  if (point.viewRange && point.viewRange > APPROACH_CAMERA.range) {
    const birdsTilt = point.viewTilt ?? 55;
    return {
      approach: {
        center,
        altitudeMode,
        range: point.viewRange * 1.45,
        tilt: Math.min(75, birdsTilt + 10),
        heading: APPROACH_CAMERA.heading,
        roll: 0,
      },
      birdsEye: {
        center,
        altitudeMode,
        range: point.viewRange,
        tilt: birdsTilt,
        heading: BIRDS_EYE_CAMERA.heading,
        roll: 0,
      },
    };
  }

  return {
    approach: {
      center,
      altitudeMode,
      range: APPROACH_CAMERA.range,
      tilt: APPROACH_CAMERA.tilt,
      heading: APPROACH_CAMERA.heading,
      roll: APPROACH_CAMERA.roll,
    },
    birdsEye: {
      center,
      altitudeMode,
      range: BIRDS_EYE_CAMERA.range,
      tilt: BIRDS_EYE_CAMERA.tilt,
      heading: BIRDS_EYE_CAMERA.heading,
      roll: BIRDS_EYE_CAMERA.roll,
    },
  };
}
