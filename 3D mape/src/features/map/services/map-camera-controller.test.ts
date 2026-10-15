import { afterEach, describe, expect, it, vi } from "vitest";

import { CAMERA_TIMING } from "@/features/map/config/camera";
import { MapCameraController } from "@/features/map/services/map-camera-controller";
import type { CameraMap } from "@/features/map/types/map-camera";

function createFakeMap() {
  const calls: Array<{
    endCamera: { range?: number; tilt?: number; heading?: number };
    durationMillis?: number;
  }> = [];
  let listener: ((event: Event) => void) | null = null;

  const map: CameraMap = {
    flyCameraTo(options) {
      calls.push(options);
    },
    stopCameraAnimation() {},
    addEventListener(_type, nextListener) {
      listener = nextListener;
    },
    removeEventListener() {
      listener = null;
    },
    center: { lat: 42.4414, lng: 19.2628, altitude: 50 },
    range: 2800,
    tilt: 62,
    heading: 32,
    roll: 0,
  };

  return {
    map,
    calls,
    emit() {
      listener?.(new Event("gmp-animationend"));
    },
  };
}

const point = { latitude: 42.445131, longitude: 19.258355 };

describe("MapCameraController", () => {
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("flies in two steps and settles only after the bird's-eye leg", async () => {
    const fake = createFakeMap();
    const controller = new MapCameraController(fake.map);
    const onSettle = vi.fn();

    expect(controller.flyToLocation(point, { onSettle })).toBe(true);
    expect(fake.calls[0]?.endCamera.range).toBe(900);
    expect(fake.calls[0]?.endCamera.tilt).toBe(68);
    expect(fake.calls[0]?.durationMillis).toBe(2800);

    await Promise.resolve();
    fake.emit();

    expect(fake.calls[1]?.endCamera.range).toBe(460);
    expect(fake.calls[1]?.endCamera.tilt).toBe(32);
    expect(fake.calls[1]?.endCamera).toMatchObject({
      center: { lat: point.latitude, lng: point.longitude, altitude: 0 },
      altitudeMode: "RELATIVE_TO_GROUND",
    });
    expect(onSettle).not.toHaveBeenCalled();

    fake.emit();
    expect(onSettle).toHaveBeenCalledOnce();
    controller.dispose();
  });

  it("still finishes directly above the place when the animation end event never arrives", async () => {
    vi.useFakeTimers();
    const fake = createFakeMap();
    const controller = new MapCameraController(fake.map);
    const onSettle = vi.fn();

    controller.flyToLocation(point, { onSettle });

    await vi.advanceTimersByTimeAsync(CAMERA_TIMING.approachMillis + 400);
    expect(fake.calls.at(-1)?.endCamera).toMatchObject({
      range: 460,
      tilt: 32,
      center: { lat: point.latitude, lng: point.longitude, altitude: 0 },
      altitudeMode: "RELATIVE_TO_GROUND",
    });
    expect(onSettle).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(CAMERA_TIMING.birdsEyeMillis + 400);
    expect(onSettle).toHaveBeenCalledOnce();
    controller.dispose();
    vi.useRealTimers();
  });

  it("supersedes an in-flight animation when another place is selected", async () => {
    const fake = createFakeMap();
    const controller = new MapCameraController(fake.map);
    const firstSettle = vi.fn();
    const secondSettle = vi.fn();

    controller.flyToLocation(point, { onSettle: firstSettle });
    controller.flyToLocation(
      { latitude: 42.435597, longitude: 19.260069 },
      { onSettle: secondSettle },
    );

    await Promise.resolve();
    fake.emit();
    fake.emit();

    expect(firstSettle).not.toHaveBeenCalled();
    expect(secondSettle).toHaveBeenCalledOnce();
    expect(fake.calls.at(-1)?.endCamera).toMatchObject({
      range: 460,
      tilt: 32,
    });
  });

  it("moves immediately when reduced motion is requested", () => {
    vi.stubGlobal(
      "matchMedia",
      vi.fn().mockReturnValue({ matches: true }),
    );
    const fake = createFakeMap();
    const controller = new MapCameraController(fake.map);
    const onSettle = vi.fn();

    expect(controller.flyToLocation(point, { onSettle })).toBe(false);
    expect(fake.calls).toHaveLength(1);
    expect(fake.calls[0]).toMatchObject({
      durationMillis: 0,
      endCamera: { range: 460, tilt: 32 },
    });
    expect(onSettle).toHaveBeenCalledOnce();
  });

  it("captures the current camera and flies back to it", async () => {
    const fake = createFakeMap();
    const controller = new MapCameraController(fake.map);
    const snapshot = controller.captureCamera();

    expect(snapshot).toEqual({
      center: { lat: 42.4414, lng: 19.2628, altitude: 50 },
      range: 2800,
      tilt: 62,
      heading: 32,
      roll: 0,
    });

    expect(snapshot && controller.restoreCamera(snapshot)).toBe(true);
    await Promise.resolve();

    expect(fake.calls[0]).toMatchObject({
      durationMillis: 1600,
      endCamera: {
        center: snapshot?.center,
        range: 2800,
        tilt: 62,
        heading: 32,
        roll: 0,
        altitudeMode: "ABSOLUTE",
      },
    });
  });

  it("returns no snapshot when the camera is incomplete", () => {
    const fake = createFakeMap();
    const controller = new MapCameraController({ ...fake.map, range: null });

    expect(controller.captureCamera()).toBeNull();
  });

  it("rotates heading from the current camera", async () => {
    const fake = createFakeMap();
    const controller = new MapCameraController(fake.map);

    expect(controller.nudgeHeading(45)).toBe(true);
    await Promise.resolve();

    expect(fake.calls[0]?.endCamera.heading).toBe(77);
  });
});
