"use client";

import { useEffect, useImperativeHandle, useRef, type Ref } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import { BRANCH_DEMO_IMAGES } from "@/features/scene/data/branch-photo";

const BACKGROUND = "#121612";
const CAMERA_POSITION = new THREE.Vector3(0, 0.12, 6.4);
const PLANE_HEIGHT = 1.7;
const MAX_WIDTH = 2.45;
const SLIDE_STEP = 1.85;
const FOCUS_MS = 520;
const SLIDE_LIMIT = BRANCH_DEMO_IMAGES.length;

export type PhotoSceneHandle = {
  step: (direction: number) => void;
};

type PhotoSceneProps = {
  ref?: Ref<PhotoSceneHandle>;
  imageUrls: readonly string[];
  active?: boolean;
  resetToken?: number;
};

type Slide = {
  mesh: THREE.Mesh;
  material: THREE.MeshBasicMaterial;
  index: number;
  url: string;
  aspect: number;
};

function wrapDelta(from: number, to: number, count: number): number {
  if (count <= 0) return 0;
  let delta = to - from;
  delta = ((delta % count) + count) % count;
  if (delta > count / 2) delta -= count;
  return delta;
}

function cardSize(aspect: number, slotScale: number): { width: number; height: number } {
  const height = PLANE_HEIGHT * slotScale;
  const width = height * aspect;
  if (width <= MAX_WIDTH * slotScale) {
    return { width, height };
  }
  const fit = (MAX_WIDTH * slotScale) / width;
  return { width: width * fit, height: height * fit };
}

function nearestStop(current: number, index: number, count: number): number {
  const base = Math.round(current / count) * count + index;
  const candidates = [base - count, base, base + count];
  return candidates.reduce((best, next) =>
    Math.abs(next - current) < Math.abs(best - current) ? next : best,
  );
}

export function PhotoScene({
  ref,
  imageUrls,
  active = true,
  resetToken = 0,
}: PhotoSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const activeRef = useRef(active);
  const imageUrlsRef = useRef(imageUrls);
  const resetTokenRef = useRef(resetToken);
  const resumeRef = useRef<(() => void) | null>(null);
  const resetCameraRef = useRef<(() => void) | null>(null);
  const stepRef = useRef<(direction: number) => void>(() => undefined);

  useImperativeHandle(ref, () => ({
    step: (direction: number) => stepRef.current(direction),
  }));

  useEffect(() => {
    activeRef.current = active;
    imageUrlsRef.current = imageUrls;
    if (resetToken !== resetTokenRef.current) {
      resetTokenRef.current = resetToken;
      resetCameraRef.current?.();
    }
    if (active) {
      resumeRef.current?.();
    }
  });

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(container.clientWidth, container.clientHeight);
    renderer.domElement.className = "block h-full w-full";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BACKGROUND);

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.05,
      40,
    );
    camera.position.copy(CAMERA_POSITION);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 0, 0);
    controls.minDistance = 3.2;
    controls.maxDistance = 12;
    controls.enablePan = true;

    const group = new THREE.Group();
    scene.add(group);

    const slides: Slide[] = [];
    for (let index = 0; index < SLIDE_LIMIT; index += 1) {
      const material = new THREE.MeshBasicMaterial({
        color: "#ffffff",
        side: THREE.DoubleSide,
        transparent: true,
        opacity: index === 0 ? 1 : 0.38,
        depthWrite: index === 0,
      });
      const mesh = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), material);
      mesh.scale.set(PLANE_HEIGHT * 1.6, PLANE_HEIGHT, 1);
      mesh.visible = false;
      group.add(mesh);
      slides.push({ mesh, material, index, url: "", aspect: 1.6 });
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const clock = new THREE.Clock();
    const loader = new THREE.TextureLoader();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let appliedKey = "";
    let focusFrom = 0;
    let focusTo = 0;
    let focusStart = 0;
    let pointerDown: { x: number; y: number } | null = null;
    let frame = 0;

    const sampleFocus = (now: number) => {
      const elapsed = now - focusStart;
      if (reduceMotion || elapsed >= FOCUS_MS) return focusTo;
      const t = elapsed / FOCUS_MS;
      const eased = t * t * (3 - 2 * t);
      return focusFrom + (focusTo - focusFrom) * eased;
    };

    const visibleCount = () =>
      slides.reduce((count, slide) => count + (slide.mesh.visible ? 1 : 0), 0);

    const syncSlides = (urls: readonly string[]) => {
      const next = urls.slice(0, SLIDE_LIMIT);
      const key = next.join("|");
      if (key === appliedKey) return;
      appliedKey = key;

      slides.forEach((slide, index) => {
        const url = next[index];
        slide.mesh.visible = Boolean(url);
        if (!url || url === slide.url) return;
        slide.url = url;
        loader.load(
          url,
          (texture) => {
            if (slide.url !== url) {
              texture.dispose();
              return;
            }
            texture.colorSpace = THREE.SRGBColorSpace;
            const previous = slide.material.map;
            slide.material.map = texture;
            slide.material.needsUpdate = true;
            const image = texture.image as { width?: number; height?: number };
            const width = image.width ?? 1;
            const height = image.height ?? 1;
            slide.aspect = width / Math.max(height, 1);
            previous?.dispose();
          },
          undefined,
          () => {
            if (slide.url === url) slide.url = "";
          },
        );
      });
    };

    const placeSlides = (now: number) => {
      const count = visibleCount();
      if (count === 0) return;
      const focus = sampleFocus(now);

      for (const slide of slides) {
        if (!slide.mesh.visible) continue;
        const delta = wrapDelta(focus, slide.index, count);
        const distance = Math.abs(delta);
        const emphasis = Math.min(distance, 1);
        const slotScale = 1 - emphasis * 0.22;
        const size = cardSize(slide.aspect, slotScale);
        slide.mesh.scale.set(size.width, size.height, 1);
        slide.mesh.position.set(delta * SLIDE_STEP, 0, -distance * 0.55);
        slide.mesh.rotation.y = -delta * 0.18;
        slide.material.opacity = Math.max(0.22, 1 - distance * 0.62);
        slide.material.depthWrite = distance < 0.25;
        slide.mesh.renderOrder = 20 - Math.round(distance * 5);
      }
    };

    const resetView = () => {
      focusFrom = 0;
      focusTo = 0;
      focusStart = 0;
      camera.position.copy(CAMERA_POSITION);
      controls.target.set(0, 0, 0);
      controls.update();
      placeSlides(performance.now());
    };
    resetCameraRef.current = resetView;
    stepRef.current = (direction: number) => {
      if (visibleCount() < 2 || direction === 0) return;
      const now = performance.now();
      focusFrom = sampleFocus(now);
      focusTo += Math.sign(direction);
      focusStart = now;
    };

    const onPointerDown = (event: PointerEvent) => {
      pointerDown = { x: event.clientX, y: event.clientY };
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!pointerDown) return;
      const dx = event.clientX - pointerDown.x;
      const dy = event.clientY - pointerDown.y;
      pointerDown = null;
      if (dx * dx + dy * dy > 36) return;

      const count = visibleCount();
      if (count < 2) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(
        slides.filter((slide) => slide.mesh.visible).map((slide) => slide.mesh),
      );
      const hit = hits[0]?.object;
      const slide = slides.find((item) => item.mesh === hit);
      if (!slide) return;
      const now = performance.now();
      const focus = sampleFocus(now);
      if (Math.abs(wrapDelta(focus, slide.index, count)) < 0.35) return;
      focusFrom = focus;
      focusTo = nearestStop(focus, slide.index, count);
      focusStart = now;
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    syncSlides(imageUrlsRef.current);

    const renderFrame = () => {
      if (!activeRef.current) {
        frame = 0;
        return;
      }

      frame = window.requestAnimationFrame(renderFrame);
      syncSlides(imageUrlsRef.current);
      placeSlides(performance.now());
      const elapsed = clock.getElapsedTime();
      group.position.y = reduceMotion ? 0 : Math.sin(elapsed * 0.9) * 0.1;
      controls.update();
      renderer.render(scene, camera);
    };

    resumeRef.current = () => {
      if (frame === 0 && activeRef.current) {
        renderFrame();
      }
    };

    renderFrame();

    const resize = () => {
      const width = container.clientWidth;
      const height = Math.max(container.clientHeight, 1);
      camera.aspect = width / height;
      camera.updateProjectionMatrix();
      renderer.setSize(width, height);
    };

    const observer = new ResizeObserver(resize);
    observer.observe(container);

    return () => {
      window.cancelAnimationFrame(frame);
      observer.disconnect();
      resetCameraRef.current = null;
      resumeRef.current = null;
      stepRef.current = () => undefined;
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      controls.dispose();
      for (const slide of slides) {
        slide.material.map?.dispose();
        slide.material.dispose();
        slide.mesh.geometry.dispose();
      }
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}
