"use client";

import { useEffect, useRef, type RefObject } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import {
  FACADE_Z,
  FLOOR_HEIGHT,
  FLOOR_HOTSPOTS,
  type FloorHotspot,
} from "@/features/scene/data/house-hotspots";

const BACKGROUND = "#121612";
const PULSE_COLOR = "#ff4d8d";
const OUTSIDE_POSITION = new THREE.Vector3(6.8, 4.6, 9.2);
const OUTSIDE_TARGET = new THREE.Vector3(0, 1.9, 0);

type ExampleSceneProps = {
  selectedId: FloorHotspot["id"] | null;
  hoveredId: FloorHotspot["id"] | null;
  anchorRef: RefObject<HTMLDivElement | null>;
  onSelect: (id: FloorHotspot["id"] | null) => void;
  onHover: (id: FloorHotspot["id"] | null) => void;
  /** When false the WebGL loop stops, but the renderer stays in memory. */
  active?: boolean;
};

type Marker = {
  id: FloorHotspot["id"];
  group: THREE.Group;
  rings: THREE.Mesh[];
  core: THREE.Mesh;
  hit: THREE.Mesh;
};

export function ExampleScene({
  selectedId,
  hoveredId,
  anchorRef,
  onSelect,
  onHover,
  active = true,
}: ExampleSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  const onHoverRef = useRef(onHover);
  const selectedIdRef = useRef(selectedId);
  const hoveredIdRef = useRef(hoveredId);
  const anchorRefProp = useRef(anchorRef);
  const activeRef = useRef(active);
  const resumeRef = useRef<(() => void) | null>(null);

  useEffect(() => {
    onSelectRef.current = onSelect;
    onHoverRef.current = onHover;
    selectedIdRef.current = selectedId;
    hoveredIdRef.current = hoveredId;
    anchorRefProp.current = anchorRef;
    activeRef.current = active;
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
    renderer.shadowMap.enabled = true;
    renderer.domElement.className = "block h-full w-full";
    container.appendChild(renderer.domElement);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(BACKGROUND);
    scene.fog = new THREE.Fog(BACKGROUND, 16, 36);

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      100,
    );
    camera.near = 0.05;
    camera.position.copy(OUTSIDE_POSITION);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.copy(OUTSIDE_TARGET);
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 6;
    controls.maxDistance = 18;

    scene.add(new THREE.AmbientLight("#d7e2d4", 0.5));
    scene.add(new THREE.HemisphereLight("#f4efe4", "#1a221c", 0.75));

    const keyLight = new THREE.DirectionalLight("#fff4e4", 2.5);
    keyLight.position.set(7, 12, 6);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.normalBias = 0.04;
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 24;
    keyLight.shadow.camera.left = -12;
    keyLight.shadow.camera.right = 12;
    keyLight.shadow.camera.top = 12;
    keyLight.shadow.camera.bottom = -12;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight("#8eb4ff", 0.5);
    fillLight.position.set(-5, 3, -3);
    scene.add(fillLight);

    scene.add(createGround());
    scene.add(createScenery());
    const building = createBuilding();
    scene.add(building.group);

    const markers: Marker[] = [];
    const hitTargets: THREE.Object3D[] = [];

    for (const hotspot of FLOOR_HOTSPOTS) {
      const marker = createMarker(hotspot);
      markers.push(marker);
      hitTargets.push(marker.hit);
      scene.add(marker.group);
    }

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    const clock = new THREE.Clock();
    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let pointerDown: { x: number; y: number } | null = null;
    let frame = 0;

    const setPointer = (event: PointerEvent) => {
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;
    };

    const hotspotAtPointer = (event: PointerEvent) => {
      setPointer(event);
      raycaster.setFromCamera(pointer, camera);
      const hit = raycaster.intersectObjects(hitTargets, false)[0];
      const id = hit?.object.userData.hotspotId;
      return typeof id === "string" ? (id as FloorHotspot["id"]) : null;
    };

    const onPointerDown = (event: PointerEvent) => {
      pointerDown = { x: event.clientX, y: event.clientY };
    };

    const onPointerUp = (event: PointerEvent) => {
      if (!pointerDown) return;
      const moved =
        (event.clientX - pointerDown.x) ** 2 +
        (event.clientY - pointerDown.y) ** 2;
      pointerDown = null;
      if (moved > 16) return;
      const id = hotspotAtPointer(event);
      if (id) onSelectRef.current(id);
    };

    let hoveredMarker: FloorHotspot["id"] | null = null;

    const setHoveredMarker = (id: FloorHotspot["id"] | null) => {
      if (id === hoveredMarker) return;
      hoveredMarker = id;
      onHoverRef.current(id);
    };

    const onPointerMove = (event: PointerEvent) => {
      const id = hotspotAtPointer(event);
      renderer.domElement.style.cursor = id ? "pointer" : "grab";
      setHoveredMarker(id);
    };

    const onPointerLeave = () => {
      renderer.domElement.style.cursor = "grab";
      setHoveredMarker(null);
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointermove", onPointerMove);
    renderer.domElement.addEventListener("pointerleave", onPointerLeave);

    const anchorPoint = new THREE.Vector3();
    const scratchPosition = new THREE.Vector3();
    const scratchTarget = new THREE.Vector3();
    let flight: Flight | null = null;
    let appliedSelection: FloorHotspot["id"] | null = null;
    let lastLevel = 1;

    const setOrbitLimits = (inside: boolean) => {
      controls.minDistance = inside ? 0.2 : 6;
      controls.maxDistance = inside ? 1.5 : 18;
      controls.maxPolarAngle = inside ? Math.PI * 0.92 : Math.PI / 2.05;
      camera.fov = inside ? 60 : 42;
      camera.updateProjectionMatrix();
    };

    const startFlight = (id: FloorHotspot["id"] | null) => {
      const entry = id ? ENTRIES[id] : null;
      const exitY = lastLevel * FLOOR_HEIGHT;
      if (id) {
        lastLevel = FLOOR_HOTSPOTS.find((hotspot) => hotspot.id === id)!.level;
      }
      controls.minDistance = 0.2;
      controls.maxDistance = 22;
      flight = {
        fromPos: camera.position.clone(),
        viaPos: entry ? entry.via : new THREE.Vector3(0, exitY + 1.15, 3.4),
        toPos: entry ? entry.inside : OUTSIDE_POSITION.clone(),
        fromTarget: controls.target.clone(),
        viaTarget: entry
          ? entry.opening
          : new THREE.Vector3(0, exitY + 0.7, 1.25),
        toTarget: entry ? entry.look : OUTSIDE_TARGET.clone(),
        fromFov: camera.fov,
        toFov: entry ? 60 : 42,
        start: performance.now(),
        duration: reduceMotion ? 0 : 1900,
      };
      controls.enabled = false;
    };

    const renderFrame = () => {
      if (!activeRef.current) {
        frame = 0;
        return;
      }

      frame = window.requestAnimationFrame(renderFrame);
      const elapsed = clock.getElapsedTime();

      if (selectedIdRef.current !== appliedSelection) {
        appliedSelection = selectedIdRef.current;
        startFlight(appliedSelection);
      }

      if (flight) {
        const progress =
          flight.duration === 0
            ? 1
            : (performance.now() - flight.start) / flight.duration;
        const eased = smoothstep(progress);
        pointOnCurve(
          flight.fromPos,
          flight.viaPos,
          flight.toPos,
          eased,
          scratchPosition,
        );
        pointOnCurve(
          flight.fromTarget,
          flight.viaTarget,
          flight.toTarget,
          eased,
          scratchTarget,
        );
        camera.position.copy(scratchPosition);
        controls.target.copy(scratchTarget);
        camera.fov = flight.fromFov + (flight.toFov - flight.fromFov) * eased;
        camera.updateProjectionMatrix();

        if (progress >= 1) {
          const inside = appliedSelection !== null;
          setOrbitLimits(inside);
          controls.enabled = true;
          flight = null;
        }
      }

      for (const marker of markers) {
        const active =
          selectedIdRef.current === marker.id ||
          hoveredIdRef.current === marker.id;
        const coreMaterial = marker.core.material;
        if (coreMaterial instanceof THREE.MeshBasicMaterial) {
          coreMaterial.color.set(active ? "#ffffff" : PULSE_COLOR);
        }
        marker.core.scale.setScalar(active ? 1.4 : 1);

        marker.rings.forEach((ring, index) => {
          ring.lookAt(camera.position);
          const material = ring.material;
          if (!(material instanceof THREE.MeshBasicMaterial)) return;

          if (reduceMotion) {
            ring.scale.setScalar(active ? 2.2 : 1.6);
            material.opacity = active ? 0.7 : 0.4;
            return;
          }

          const cycle = (elapsed * 0.65 + index * 0.5) % 1;
          ring.scale.setScalar(1 + cycle * 2.6);
          material.opacity = (active ? 0.95 : 0.75) * (1 - cycle);
        });
      }

      const focusId = selectedIdRef.current ?? hoveredIdRef.current;
      for (const story of building.stories) {
        const goal = focusId && story.id !== focusId ? 1 : 0;
        story.amount = reduceMotion
          ? goal
          : story.amount + (goal - story.amount) * 0.16;
        const shade = story.amount * 0.78;
        story.materials.forEach((material, index) => {
          material.color.copy(story.baseColors[index]).lerp(DIM_COLOR, shade);
        });
        story.lights.forEach((light, index) => {
          light.intensity = story.baseIntensities[index] * (1 - story.amount * 0.88);
        });
      }

      const anchor = anchorRefProp.current.current;
      const anchorId = hoveredIdRef.current;
      const anchorHotspot = anchorId
        ? FLOOR_HOTSPOTS.find((hotspot) => hotspot.id === anchorId)
        : undefined;
      if (anchor && anchorHotspot) {
        anchorPoint.set(...anchorHotspot.position).project(camera);
        const width = container.clientWidth;
        const height = container.clientHeight;
        const x = (anchorPoint.x * 0.5 + 0.5) * width;
        const y = (-anchorPoint.y * 0.5 + 0.5) * height;
        const inFront = anchorPoint.z < 1;
        const card = anchor.querySelector("[data-callout-card]");
        const half = card instanceof HTMLElement ? card.offsetWidth / 2 : 128;
        const cardHeight = card instanceof HTMLElement ? card.offsetHeight : 108;
        const margin = 16;
        let shift = 0;
        if (y - 80 - cardHeight < 128) {
          const beside = half + 18;
          shift = x + beside + half > width - margin ? -beside : beside;
        }
        if (x + shift + half > width - margin) {
          shift = width - margin - half - x;
        }
        if (x + shift - half < margin) shift = margin + half - x;
        anchor.style.transform = `translate3d(${x}px, ${y}px, 0)`;
        anchor.style.setProperty("--callout-shift", `${shift}px`);
        anchor.style.setProperty(
          "--elbow-origin",
          shift < 0 ? "right center" : "left center",
        );
        anchor.dataset.placed = inFront ? "true" : "false";
      }

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
      renderer.domElement.removeEventListener("pointerdown", onPointerDown);
      renderer.domElement.removeEventListener("pointerup", onPointerUp);
      renderer.domElement.removeEventListener("pointermove", onPointerMove);
      renderer.domElement.removeEventListener("pointerleave", onPointerLeave);
      controls.dispose();

      const geometries = new Set<THREE.BufferGeometry>();
      const materials = new Set<THREE.Material>();
      scene.traverse((object) => {
        if (!(object instanceof THREE.Mesh)) return;
        geometries.add(object.geometry);
        const list = Array.isArray(object.material)
          ? object.material
          : [object.material];
        for (const material of list) materials.add(material);
      });
      for (const geometry of geometries) geometry.dispose();
      for (const material of materials) material.dispose();

      renderer.dispose();
      renderer.domElement.remove();
    };
  }, []);

  return <div ref={containerRef} className="h-full w-full" />;
}

const ENTRIES: Record<
  FloorHotspot["id"],
  {
    via: THREE.Vector3;
    opening: THREE.Vector3;
    inside: THREE.Vector3;
    look: THREE.Vector3;
  }
> = {
  ground: apartmentEntry(0),
  first: apartmentEntry(1),
  second: apartmentEntry(2),
};

function apartmentEntry(level: number) {
  const y = level * FLOOR_HEIGHT;
  return {
    via: new THREE.Vector3(0, y + 0.78, 2.45),
    opening: new THREE.Vector3(0, y + 0.7, FACADE_Z),
    inside: new THREE.Vector3(0.08, y + 0.62, 0.4),
    look: new THREE.Vector3(0, y + 0.48, -0.75),
  };
}

type Flight = {
  fromPos: THREE.Vector3;
  viaPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  viaTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
  fromFov: number;
  toFov: number;
  start: number;
  duration: number;
};

function smoothstep(amount: number) {
  const t = Math.min(1, Math.max(0, amount));
  return t * t * (3 - 2 * t);
}

function pointOnCurve(
  start: THREE.Vector3,
  control: THREE.Vector3,
  end: THREE.Vector3,
  amount: number,
  target: THREE.Vector3,
) {
  const inverse = 1 - amount;
  target.set(
    inverse * inverse * start.x +
      2 * inverse * amount * control.x +
      amount * amount * end.x,
    inverse * inverse * start.y +
      2 * inverse * amount * control.y +
      amount * amount * end.y,
    inverse * inverse * start.z +
      2 * inverse * amount * control.z +
      amount * amount * end.z,
  );
}

function createGround() {
  const ground = new THREE.Group();

  const yard = new THREE.Mesh(
    new THREE.CylinderGeometry(4.2, 4.4, 0.28, 64),
    new THREE.MeshStandardMaterial({
      color: "#2a382e",
      roughness: 0.9,
      metalness: 0.02,
    }),
  );
  yard.position.y = -0.14;
  yard.receiveShadow = true;
  ground.add(yard);

  const path = new THREE.Mesh(
    new THREE.BoxGeometry(0.7, 0.04, 1.7),
    new THREE.MeshStandardMaterial({
      color: "#cbbfa8",
      roughness: 0.82,
    }),
  );
  path.position.set(0, 0.02, 2.2);
  path.receiveShadow = true;
  ground.add(path);

  return ground;
}

type TreeKind = "pine" | "leaf";

type TreeSpot = {
  x: number;
  z: number;
  scale: number;
  yaw: number;
  kind: TreeKind;
};

const TREES: TreeSpot[] = [
  { x: -3.4, z: 2.6, scale: 1.15, yaw: 0.4, kind: "pine" },
  { x: -5.2, z: 0.8, scale: 1.45, yaw: 1.2, kind: "leaf" },
  { x: -4.4, z: -2.1, scale: 1.1, yaw: 0.2, kind: "pine" },
  { x: -2.4, z: -5.1, scale: 1.6, yaw: 2.1, kind: "leaf" },
  { x: 0.6, z: -6.2, scale: 1.25, yaw: 0.8, kind: "pine" },
  { x: 3.2, z: -4.6, scale: 1.7, yaw: 1.7, kind: "leaf" },
  { x: 5.4, z: -1.8, scale: 1.2, yaw: 0.5, kind: "pine" },
  { x: 5.8, z: 1.4, scale: 1.5, yaw: 2.4, kind: "leaf" },
  { x: -5.8, z: 4.6, scale: 1.05, yaw: 0.9, kind: "pine" },
  { x: 1.6, z: 7.2, scale: 1.35, yaw: 1.4, kind: "leaf" },
  { x: -6.4, z: -4.4, scale: 1.55, yaw: 0.3, kind: "pine" },
  { x: 7.1, z: -4.2, scale: 1.3, yaw: 1.1, kind: "leaf" },
  { x: -7.2, z: 2.4, scale: 1.4, yaw: 2.2, kind: "pine" },
  { x: 7.4, z: 3.6, scale: 1.15, yaw: 0.6, kind: "leaf" },
];

function createScenery() {
  const scenery = new THREE.Group();

  const meadow = new THREE.Mesh(
    new THREE.CylinderGeometry(13, 13.6, 0.16, 72),
    new THREE.MeshStandardMaterial({
      color: "#243028",
      roughness: 1,
    }),
  );
  meadow.position.y = -0.12;
  meadow.receiveShadow = true;
  scenery.add(meadow);

  const showTrees = false;
  const trunk = new THREE.CylinderGeometry(0.09, 0.14, 1, 6);
  const pineCone = new THREE.ConeGeometry(0.62, 1.05, 7);
  const canopy = new THREE.IcosahedronGeometry(0.55, 0);
  const bark = new THREE.MeshStandardMaterial({
    color: "#6a4a32",
    roughness: 0.92,
  });
  const pine = new THREE.MeshStandardMaterial({
    color: "#2c6a3c",
    roughness: 0.86,
    flatShading: true,
  });
  const pineDark = new THREE.MeshStandardMaterial({
    color: "#1f5230",
    roughness: 0.9,
    flatShading: true,
  });
  const leaf = new THREE.MeshStandardMaterial({
    color: "#3e8a48",
    roughness: 0.8,
    flatShading: true,
  });
  const leafDark = new THREE.MeshStandardMaterial({
    color: "#2f6d38",
    roughness: 0.84,
    flatShading: true,
  });

  if (showTrees) {
    for (const spot of TREES) {
      scenery.add(
        spot.kind === "pine"
          ? createPine(spot, trunk, pineCone, bark, pine, pineDark)
          : createLeafTree(spot, trunk, canopy, bark, leaf, leafDark),
      );
    }
  }

  return scenery;
}

function createPine(
  spot: TreeSpot,
  trunk: THREE.BufferGeometry,
  cone: THREE.BufferGeometry,
  bark: THREE.Material,
  pine: THREE.Material,
  pineDark: THREE.Material,
) {
  const tree = new THREE.Group();
  tree.position.set(spot.x, -0.04, spot.z);
  tree.scale.setScalar(spot.scale);
  tree.rotation.y = spot.yaw;

  const stem = new THREE.Mesh(trunk, bark);
  stem.position.y = 0.5;
  stem.castShadow = true;
  tree.add(stem);

  const layers: Array<{ y: number; scale: number; material: THREE.Material }> =
    [
      { y: 1.15, scale: 1.15, material: pineDark },
      { y: 1.72, scale: 0.85, material: pine },
      { y: 2.18, scale: 0.55, material: pine },
    ];

  for (const layer of layers) {
    const foliage = new THREE.Mesh(cone, layer.material);
    foliage.position.y = layer.y;
    foliage.scale.setScalar(layer.scale);
    foliage.castShadow = true;
    foliage.receiveShadow = true;
    tree.add(foliage);
  }

  return tree;
}

function createLeafTree(
  spot: TreeSpot,
  trunk: THREE.BufferGeometry,
  canopy: THREE.BufferGeometry,
  bark: THREE.Material,
  leaf: THREE.Material,
  leafDark: THREE.Material,
) {
  const tree = new THREE.Group();
  tree.position.set(spot.x, -0.04, spot.z);
  tree.scale.setScalar(spot.scale);
  tree.rotation.y = spot.yaw;

  const stem = new THREE.Mesh(trunk, bark);
  stem.position.y = 0.62;
  stem.scale.set(0.85, 1.25, 0.85);
  stem.castShadow = true;
  tree.add(stem);

  const crowns: Array<{
    x: number;
    y: number;
    z: number;
    scale: number;
    material: THREE.Material;
  }> = [
    { x: 0, y: 1.7, z: 0, scale: 1.2, material: leaf },
    { x: 0.38, y: 1.42, z: 0.12, scale: 0.78, material: leafDark },
    { x: -0.32, y: 1.48, z: -0.16, scale: 0.72, material: leaf },
  ];

  for (const crown of crowns) {
    const blob = new THREE.Mesh(canopy, crown.material);
    blob.position.set(crown.x, crown.y, crown.z);
    blob.scale.setScalar(crown.scale);
    blob.castShadow = true;
    blob.receiveShadow = true;
    tree.add(blob);
  }

  return tree;
}

const DIM_COLOR = new THREE.Color("#101412");

type StoryFocus = {
  id: FloorHotspot["id"];
  materials: Array<THREE.MeshStandardMaterial | THREE.MeshBasicMaterial>;
  lights: THREE.PointLight[];
  baseColors: THREE.Color[];
  baseIntensities: number[];
  amount: number;
};

function createBuilding() {
  const group = new THREE.Group();
  const stories: StoryFocus[] = [];
  const walls = new THREE.MeshStandardMaterial({
    color: "#efe6d6",
    roughness: 0.78,
    side: THREE.DoubleSide,
  });
  const trim = new THREE.MeshStandardMaterial({
    color: "#cbbba6",
    roughness: 0.7,
  });
  const floorWood = new THREE.MeshStandardMaterial({
    color: "#a56b45",
    roughness: 0.7,
  });
  const wood = new THREE.MeshStandardMaterial({
    color: "#6b3f2a",
    roughness: 0.72,
  });
  const glass = new THREE.MeshStandardMaterial({
    color: "#9ec4d4",
    roughness: 0.08,
    metalness: 0.04,
    transparent: true,
    opacity: 0.28,
    depthWrite: false,
    side: THREE.DoubleSide,
  });
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: "#8d5a4a",
    roughness: 0.72,
  });
  const concrete = new THREE.MeshStandardMaterial({
    color: "#d9d0c2",
    roughness: 0.74,
  });
  const rail = new THREE.MeshStandardMaterial({
    color: "#efe6d6",
    roughness: 0.55,
    metalness: 0.18,
  });
  const tableTop = new THREE.MeshStandardMaterial({
    color: "#d7c4a3",
    roughness: 0.55,
  });
  const sofaFabric = new THREE.MeshStandardMaterial({
    color: "#6e7f72",
    roughness: 0.8,
  });
  const rugColors = ["#8f4d3c", "#3f6d62", "#4c6288"];

  for (let level = 0; level < 3; level += 1) {
    const story = createStory(level, {
      walls: walls.clone(),
      floorWood: floorWood.clone(),
      wood: wood.clone(),
      glass: glass.clone(),
      concrete: concrete.clone(),
      rail: rail.clone(),
      tableTop: tableTop.clone(),
      sofaFabric: sofaFabric.clone(),
      rug: new THREE.MeshStandardMaterial({
        color: rugColors[level],
        roughness: 0.9,
      }),
    });
    group.add(story);
    stories.push(collectStoryFocus(story, FLOOR_HOTSPOTS[level].id));
  }

  walls.dispose();
  floorWood.dispose();
  wood.dispose();
  glass.dispose();
  concrete.dispose();
  rail.dispose();
  tableTop.dispose();
  sofaFabric.dispose();

  const roof = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.12, 2.35), roofMaterial);
  roof.position.set(0, FLOOR_HEIGHT * 3 + 0.06, 0.02);
  roof.castShadow = true;
  roof.receiveShadow = true;
  group.add(roof);

  const parapet = new THREE.Mesh(new THREE.BoxGeometry(3.05, 0.22, 0.08), trim);
  parapet.position.set(0, FLOOR_HEIGHT * 3 + 0.22, FACADE_Z + 0.02);
  parapet.castShadow = true;
  group.add(parapet);

  return { group, stories };
}

function collectStoryFocus(
  story: THREE.Group,
  id: FloorHotspot["id"],
): StoryFocus {
  const materials: StoryFocus["materials"] = [];
  const lights: THREE.PointLight[] = [];
  story.traverse((object) => {
    if (object instanceof THREE.PointLight) {
      lights.push(object);
      return;
    }
    if (!(object instanceof THREE.Mesh)) return;
    const list = Array.isArray(object.material)
      ? object.material
      : [object.material];
    for (const material of list) {
      if (
        (material instanceof THREE.MeshStandardMaterial ||
          material instanceof THREE.MeshBasicMaterial) &&
        !materials.includes(material)
      ) {
        materials.push(material);
      }
    }
  });

  return {
    id,
    materials,
    lights,
    baseColors: materials.map((material) => material.color.clone()),
    baseIntensities: lights.map((light) => light.intensity),
    amount: 0,
  };
}

type StoryMaterials = {
  walls: THREE.Material;
  floorWood: THREE.Material;
  wood: THREE.Material;
  glass: THREE.Material;
  concrete: THREE.Material;
  rail: THREE.Material;
  tableTop: THREE.Material;
  sofaFabric: THREE.Material;
  rug: THREE.Material;
};

function createStory(level: number, materials: StoryMaterials) {
  const story = new THREE.Group();
  story.position.y = level * FLOOR_HEIGHT;

  const frontShape = new THREE.Shape();
  frontShape.moveTo(-1.4, 0);
  frontShape.lineTo(1.4, 0);
  frontShape.lineTo(1.4, FLOOR_HEIGHT);
  frontShape.lineTo(-1.4, FLOOR_HEIGHT);
  frontShape.closePath();

  const doorHole = new THREE.Path();
  doorHole.moveTo(-0.32, 0);
  doorHole.lineTo(-0.32, 1.05);
  doorHole.lineTo(0.32, 1.05);
  doorHole.lineTo(0.32, 0);
  frontShape.holes.push(doorHole);

  const frontWall = new THREE.Mesh(
    new THREE.ExtrudeGeometry(frontShape, { depth: 0.1, bevelEnabled: false }),
    materials.walls,
  );
  frontWall.position.z = FACADE_Z - 0.1;
  frontWall.castShadow = true;
  frontWall.receiveShadow = true;
  story.add(frontWall);

  for (const x of [-0.92, 0.92]) {
    const frame = new THREE.Mesh(
      new THREE.BoxGeometry(0.5, 0.56, 0.04),
      materials.concrete,
    );
    frame.position.set(x, 0.72, FACADE_Z - 0.02);
    story.add(frame);
    const pane = new THREE.Mesh(
      new THREE.BoxGeometry(0.4, 0.46, 0.02),
      materials.glass,
    );
    pane.position.set(x, 0.72, FACADE_Z + 0.02);
    story.add(pane);
  }

  const side = new THREE.Mesh(
    new THREE.BoxGeometry(0.1, FLOOR_HEIGHT, 2.13),
    materials.walls,
  );
  side.position.set(-1.4, FLOOR_HEIGHT / 2, 0.015);
  side.castShadow = true;
  side.receiveShadow = true;
  story.add(side);
  const right = side.clone();
  right.position.x = 1.4;
  story.add(right);

  for (const x of [-1.46, 1.46]) {
    for (const z of [-0.35, 0.42]) {
      const pane = new THREE.Mesh(
        new THREE.BoxGeometry(0.03, 0.42, 0.4),
        materials.glass,
      );
      pane.position.set(x, 0.72, z);
      story.add(pane);
    }
  }

  const back = new THREE.Mesh(
    new THREE.BoxGeometry(2.8, FLOOR_HEIGHT, 0.1),
    materials.walls,
  );
  back.position.set(0, FLOOR_HEIGHT / 2, -1.0);
  back.castShadow = true;
  back.receiveShadow = true;
  story.add(back);

  const floor = new THREE.Mesh(
    new THREE.BoxGeometry(2.6, 0.06, 1.88),
    materials.floorWood,
  );
  floor.position.set(0, 0.03, -0.02);
  floor.receiveShadow = true;
  story.add(floor);

  if (level > 0) {
    const plate = new THREE.Mesh(
      new THREE.BoxGeometry(3.02, 0.07, 2.32),
      materials.concrete,
    );
    plate.position.set(0, 0.02, 0.02);
    plate.castShadow = true;
    plate.receiveShadow = true;
    story.add(plate);
  }

  const rug = new THREE.Mesh(new THREE.BoxGeometry(1.15, 0.02, 0.75), materials.rug);
  rug.position.set(0.05, 0.08, -0.28);
  rug.receiveShadow = true;
  story.add(rug);

  const table = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.05, 0.4),
    materials.tableTop,
  );
  table.position.set(0.08, 0.38, -0.42);
  table.castShadow = true;
  story.add(table);

  const sofa = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.32, 0.38),
    materials.sofaFabric,
  );
  sofa.position.set(-0.02, 0.22, -0.7);
  sofa.castShadow = true;
  sofa.receiveShadow = true;
  story.add(sofa);

  const roomLight = new THREE.PointLight("#ffe0b8", 1.5, 4.2, 2);
  roomLight.position.set(0, 1.05, -0.15);
  story.add(roomLight);

  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.05, 12, 10),
    new THREE.MeshBasicMaterial({ color: "#ffe7c2" }),
  );
  lamp.position.copy(roomLight.position);
  story.add(lamp);

  if (level === 0) {
    const doorPivot = new THREE.Group();
    doorPivot.position.set(-0.32, 0, FACADE_Z - 0.02);
    doorPivot.rotation.y = 1.15;
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 1.02, 0.04),
      materials.wood,
    );
    door.position.set(0.29, 0.51, 0);
    door.castShadow = true;
    doorPivot.add(door);
    story.add(doorPivot);

    const step = new THREE.Mesh(
      new THREE.BoxGeometry(0.95, 0.08, 0.46),
      materials.concrete,
    );
    step.position.set(0, 0.04, FACADE_Z + 0.3);
    step.castShadow = true;
    step.receiveShadow = true;
    story.add(step);
  } else {
    const pane = new THREE.Mesh(
      new THREE.BoxGeometry(0.58, 0.98, 0.02),
      materials.glass,
    );
    pane.position.set(0, 0.52, FACADE_Z + 0.02);
    story.add(pane);

    const slab = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.06, 0.64),
      materials.concrete,
    );
    slab.position.set(0, 0.06, FACADE_Z + 0.32);
    slab.castShadow = true;
    slab.receiveShadow = true;
    story.add(slab);

    const railBar = new THREE.Mesh(
      new THREE.BoxGeometry(1.25, 0.04, 0.04),
      materials.rail,
    );
    railBar.position.set(0, 0.5, FACADE_Z + 0.62);
    story.add(railBar);

    for (const x of [-0.56, 0, 0.56]) {
      const post = new THREE.Mesh(
        new THREE.BoxGeometry(0.04, 0.46, 0.04),
        materials.rail,
      );
      post.position.set(x, 0.28, FACADE_Z + 0.62);
      story.add(post);
    }
  }

  return story;
}

function createMarker(hotspot: FloorHotspot): Marker {
  const group = new THREE.Group();
  group.position.set(...hotspot.position);

  const core = new THREE.Mesh(
    new THREE.SphereGeometry(0.07, 20, 16),
    new THREE.MeshBasicMaterial({ color: PULSE_COLOR }),
  );
  group.add(core);

  const hit = new THREE.Mesh(
    new THREE.SphereGeometry(0.62, 12, 12),
    new THREE.MeshBasicMaterial({
      transparent: true,
      opacity: 0,
      depthWrite: false,
    }),
  );
  hit.userData.hotspotId = hotspot.id;
  group.add(hit);

  const rings = [0, 1].map(() => {
    const ring = new THREE.Mesh(
      new THREE.RingGeometry(0.09, 0.14, 40),
      new THREE.MeshBasicMaterial({
        color: PULSE_COLOR,
        transparent: true,
        opacity: 0.8,
        side: THREE.DoubleSide,
        depthWrite: false,
      }),
    );
    group.add(ring);
    return ring;
  });

  return { id: hotspot.id, group, rings, core, hit };
}
