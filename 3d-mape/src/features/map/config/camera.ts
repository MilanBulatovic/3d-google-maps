import type { CameraTarget } from "@/features/map/types/map-camera";

/** Mean elevation used when a place does not carry its own altitude. Podgorica sits near 50 m above sea level. */
export const CITY_GROUND_ALTITUDE_METERS = 50;

/**
 * Elevated oblique of central Podgorica.
 * Tilt follows the 3D API: 0 looks straight down, 90 looks at the horizon.
 */
export const PODGORICA_OVERVIEW: CameraTarget = {
  center: { lat: 42.4414, lng: 19.2628, altitude: CITY_GROUND_ALTITUDE_METERS },
  range: 2800,
  tilt: 62,
  heading: 32,
  roll: 0,
};

/**
 * Whole-country oblique. Range is meters from the camera to the center, not a 2D zoom level.
 * The frame reaches the coast, the north, and the eastern towns.
 */
export const MONTENEGRO_OVERVIEW: CameraTarget = {
  center: { lat: 42.71, lng: 19.37, altitude: 800 },
  range: 200000,
  tilt: 65,
  heading: 18,
  roll: 0,
};

/** Side view on the way in. Tilt 68 looks toward the horizon so building faces read. */
export const APPROACH_CAMERA = {
  range: 900,
  tilt: 68,
  heading: 18,
  roll: 0,
} as const;

/** Landing view. Tilt 32 stays above the place and still shows the walls. */
export const BIRDS_EYE_CAMERA = {
  range: 460,
  tilt: 32,
  heading: 18,
  roll: 0,
} as const;

export const CAMERA_TIMING = {
  approachMillis: 2800,
  birdsEyeMillis: 1800,
  overviewMillis: 2600,
  recenterMillis: 1600,
  headingMillis: 700,
} as const;

export const HEADING_STEP_DEGREES = 45;

/** Height of marker pins above the ground surface. Extrusion requires RELATIVE_TO_GROUND or ABSOLUTE. */
export const MARKER_ALTITUDE_METERS = 70;
