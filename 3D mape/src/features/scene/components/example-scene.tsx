"use client";

import { useEffect, useRef } from "react";
import * as THREE from "three";
import { OrbitControls } from "three/addons/controls/OrbitControls.js";

import {
  HOUSE_HOTSPOTS,
  type HouseHotspot,
} from "@/features/scene/data/house-hotspots";

const BACKGROUND = "#121612";
const PULSE_COLOR = "#ff5a3c";

type ExampleSceneProps = {
  selectedId: HouseHotspot["id"] | null;
  onSelect: (id: HouseHotspot["id"] | null) => void;
};

type Marker = {
  id: HouseHotspot["id"];
  group: THREE.Group;
  rings: THREE.Mesh[];
  core: THREE.Mesh;
  hit: THREE.Mesh;
};

export function ExampleScene({ selectedId, onSelect }: ExampleSceneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const onSelectRef = useRef(onSelect);
  const selectedIdRef = useRef(selectedId);

  useEffect(() => {
    onSelectRef.current = onSelect;
    selectedIdRef.current = selectedId;
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
    scene.fog = new THREE.Fog(BACKGROUND, 12, 26);

    const camera = new THREE.PerspectiveCamera(
      42,
      container.clientWidth / Math.max(container.clientHeight, 1),
      0.1,
      100,
    );
    camera.near = 0.05;
    camera.position.set(5.6, 3.5, 7.2);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true;
    controls.target.set(0, 1.15, 0);
    controls.maxPolarAngle = Math.PI / 2.05;
    controls.minDistance = 4;
    controls.maxDistance = 16;

    scene.add(new THREE.AmbientLight("#d7e2d4", 0.5));
    scene.add(new THREE.HemisphereLight("#f4efe4", "#1a221c", 0.75));

    const keyLight = new THREE.DirectionalLight("#fff4e4", 2.5);
    keyLight.position.set(6, 9, 5);
    keyLight.castShadow = true;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 1;
    keyLight.shadow.camera.far = 24;
    keyLight.shadow.camera.left = -8;
    keyLight.shadow.camera.right = 8;
    keyLight.shadow.camera.top = 8;
    keyLight.shadow.camera.bottom = -8;
    scene.add(keyLight);

    const fillLight = new THREE.DirectionalLight("#8eb4ff", 0.5);
    fillLight.position.set(-5, 3, -3);
    scene.add(fillLight);

    scene.add(createGround());
    scene.add(createHouse());

    const markers: Marker[] = [];
    const hitTargets: THREE.Object3D[] = [];

    for (const hotspot of HOUSE_HOTSPOTS) {
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
      return typeof id === "string" ? (id as HouseHotspot["id"]) : null;
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

    const onPointerMove = (event: PointerEvent) => {
      renderer.domElement.style.cursor = hotspotAtPointer(event)
        ? "pointer"
        : "grab";
    };

    renderer.domElement.addEventListener("pointerdown", onPointerDown);
    renderer.domElement.addEventListener("pointerup", onPointerUp);
    renderer.domElement.addEventListener("pointermove", onPointerMove);

    const outsidePosition = new THREE.Vector3(5.6, 3.5, 7.2);
    const outsideTarget = new THREE.Vector3(0, 1.15, 0);
    const scratchPosition = new THREE.Vector3();
    const scratchTarget = new THREE.Vector3();
    let flight: Flight | null = null;
    let appliedSelection: HouseHotspot["id"] | null = null;

    const setOrbitLimits = (inside: boolean) => {
      controls.minDistance = inside ? 0.25 : 4;
      controls.maxDistance = inside ? 1.7 : 16;
      controls.maxPolarAngle = inside ? Math.PI * 0.92 : Math.PI / 2.05;
    };

    const startFlight = (id: HouseHotspot["id"] | null) => {
      const entry = id ? ENTRIES[id] : null;
      controls.minDistance = 0.2;
      controls.maxDistance = 20;
      flight = {
        fromPos: camera.position.clone(),
        viaPos: entry ? entry.via : new THREE.Vector3(0.4, 1.5, 3.4),
        toPos: entry ? entry.inside : outsidePosition.clone(),
        fromTarget: controls.target.clone(),
        viaTarget: entry ? entry.opening : new THREE.Vector3(0, 0.9, 0.6),
        toTarget: entry ? entry.look : outsideTarget.clone(),
        start: performance.now(),
        duration: reduceMotion ? 0 : 1900,
      };
      controls.enabled = false;
    };

    const renderFrame = () => {
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

        if (progress >= 1) {
          const inside = appliedSelection !== null;
          setOrbitLimits(inside);
          controls.enabled = true;
          flight = null;
        }
      }

      for (const marker of markers) {
        const active = selectedIdRef.current === marker.id;
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

      controls.update();
      renderer.render(scene, camera);
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
  HouseHotspot["id"],
  {
    via: THREE.Vector3;
    opening: THREE.Vector3;
    inside: THREE.Vector3;
    look: THREE.Vector3;
  }
> = {
  entrance: {
    via: new THREE.Vector3(-0.53, 0.85, 2.35),
    opening: new THREE.Vector3(-0.53, 0.7, 0.95),
    inside: new THREE.Vector3(-0.2, 0.92, 0.2),
    look: new THREE.Vector3(0.15, 0.45, -0.55),
  },
  window: {
    via: new THREE.Vector3(0.63, 0.95, 2.25),
    opening: new THREE.Vector3(0.63, 0.88, 0.95),
    inside: new THREE.Vector3(0.35, 0.95, 0.15),
    look: new THREE.Vector3(-0.25, 0.45, -0.5),
  },
  wall: {
    via: new THREE.Vector3(2.55, 0.9, 0.05),
    opening: new THREE.Vector3(1.2, 0.8, 0.05),
    inside: new THREE.Vector3(0.15, 0.95, 0.05),
    look: new THREE.Vector3(-0.45, 0.5, -0.35),
  },
};

type Flight = {
  fromPos: THREE.Vector3;
  viaPos: THREE.Vector3;
  toPos: THREE.Vector3;
  fromTarget: THREE.Vector3;
  viaTarget: THREE.Vector3;
  toTarget: THREE.Vector3;
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
  path.position.set(-0.55, 0.02, 1.85);
  path.receiveShadow = true;
  ground.add(path);

  return ground;
}

function createHouse() {
  const house = new THREE.Group();
  const walls = new THREE.MeshStandardMaterial({
    color: "#efe6d6",
    roughness: 0.78,
    side: THREE.DoubleSide,
  });
  const interior = new THREE.MeshStandardMaterial({
    color: "#f4efe4",
    roughness: 0.86,
    side: THREE.DoubleSide,
  });
  const roofMaterial = new THREE.MeshStandardMaterial({
    color: "#b5522a",
    roughness: 0.64,
    side: THREE.DoubleSide,
  });
  const wood = new THREE.MeshStandardMaterial({
    color: "#6b3f2a",
    roughness: 0.72,
  });
  const floorWood = new THREE.MeshStandardMaterial({
    color: "#a56b45",
    roughness: 0.7,
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
  const brick = new THREE.MeshStandardMaterial({
    color: "#8d6b58",
    roughness: 0.8,
  });

  const frontShape = new THREE.Shape();
  frontShape.moveTo(-1.2, 0);
  frontShape.lineTo(1.2, 0);
  frontShape.lineTo(1.2, 1.45);
  frontShape.lineTo(-1.2, 1.45);
  frontShape.closePath();

  const doorHole = new THREE.Path();
  doorHole.moveTo(-0.78, 0);
  doorHole.lineTo(-0.78, 1.02);
  doorHole.lineTo(-0.28, 1.02);
  doorHole.lineTo(-0.28, 0);
  frontShape.holes.push(doorHole);

  const windowHole = new THREE.Path();
  windowHole.moveTo(0.36, 0.66);
  windowHole.lineTo(0.36, 1.12);
  windowHole.lineTo(0.9, 1.12);
  windowHole.lineTo(0.9, 0.66);
  frontShape.holes.push(windowHole);

  const frontWall = new THREE.Mesh(
    new THREE.ExtrudeGeometry(frontShape, { depth: 0.1, bevelEnabled: false }),
    walls,
  );
  frontWall.position.z = 0.85;
  frontWall.castShadow = true;
  frontWall.receiveShadow = true;
  house.add(frontWall);

  const sideWall = new THREE.Mesh(new THREE.BoxGeometry(0.1, 1.45, 1.9), walls);
  sideWall.position.set(-1.2, 0.725, 0);
  sideWall.castShadow = true;
  sideWall.receiveShadow = true;
  house.add(sideWall);

  const rightWall = sideWall.clone();
  rightWall.position.x = 1.2;
  house.add(rightWall);

  const backWall = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.45, 0.1), walls);
  backWall.position.set(0, 0.725, -0.95);
  backWall.castShadow = true;
  backWall.receiveShadow = true;
  house.add(backWall);

  const floor = new THREE.Mesh(new THREE.BoxGeometry(2.15, 0.06, 1.6), floorWood);
  floor.position.set(0, 0.03, -0.05);
  floor.receiveShadow = true;
  house.add(floor);

  const ceiling = new THREE.Mesh(
    new THREE.BoxGeometry(2.15, 0.06, 1.6),
    interior,
  );
  ceiling.position.set(0, 1.4, -0.05);
  house.add(ceiling);

  const rug = new THREE.Mesh(
    new THREE.BoxGeometry(1.15, 0.02, 0.75),
    new THREE.MeshStandardMaterial({ color: "#8f4d3c", roughness: 0.9 }),
  );
  rug.position.set(0.05, 0.07, -0.15);
  rug.receiveShadow = true;
  house.add(rug);

  const table = new THREE.Mesh(
    new THREE.BoxGeometry(0.62, 0.05, 0.4),
    new THREE.MeshStandardMaterial({ color: "#d7c4a3", roughness: 0.55 }),
  );
  table.position.set(0.12, 0.4, -0.28);
  table.castShadow = true;
  house.add(table);

  const sofa = new THREE.Mesh(
    new THREE.BoxGeometry(0.95, 0.32, 0.38),
    new THREE.MeshStandardMaterial({ color: "#6e7f72", roughness: 0.8 }),
  );
  sofa.position.set(-0.05, 0.22, -0.62);
  sofa.castShadow = true;
  sofa.receiveShadow = true;
  house.add(sofa);

  const roomLight = new THREE.PointLight("#ffe0b8", 8, 7, 2);
  roomLight.position.set(0, 1.15, -0.1);
  house.add(roomLight);

  const lamp = new THREE.Mesh(
    new THREE.SphereGeometry(0.06, 16, 12),
    new THREE.MeshBasicMaterial({ color: "#ffe7c2" }),
  );
  lamp.position.copy(roomLight.position);
  house.add(lamp);

  const roofShape = new THREE.Shape();
  roofShape.moveTo(-1.45, 0);
  roofShape.lineTo(0, 0.95);
  roofShape.lineTo(1.45, 0);
  roofShape.closePath();
  const roof = new THREE.Mesh(
    new THREE.ExtrudeGeometry(roofShape, { depth: 2.25, bevelEnabled: false }),
    roofMaterial,
  );
  roof.position.set(0, 1.45, -1.12);
  roof.castShadow = true;
  roof.receiveShadow = true;
  house.add(roof);

  const door = new THREE.Mesh(new THREE.BoxGeometry(0.46, 0.92, 0.06), wood);
  door.position.set(-0.55, 0.46, 0.98);
  door.castShadow = true;
  house.add(door);

  const knob = new THREE.Mesh(
    new THREE.SphereGeometry(0.035, 12, 12),
    new THREE.MeshStandardMaterial({
      color: "#e6d3b3",
      metalness: 0.4,
      roughness: 0.35,
    }),
  );
  knob.position.set(-0.38, 0.46, 1.04);
  house.add(knob);

  const step = new THREE.Mesh(
    new THREE.BoxGeometry(0.72, 0.08, 0.32),
    new THREE.MeshStandardMaterial({ color: "#d9d0c2", roughness: 0.7 }),
  );
  step.position.set(-0.55, 0.04, 1.18);
  step.castShadow = true;
  step.receiveShadow = true;
  house.add(step);

  const windowGeometry = new THREE.BoxGeometry(0.52, 0.42, 0.05);
  const frontWindow = new THREE.Mesh(windowGeometry, glass);
  frontWindow.position.set(0.62, 0.88, 0.98);
  house.add(frontWindow);

  const sideWindow = new THREE.Mesh(windowGeometry, glass);
  sideWindow.position.set(1.22, 0.88, 0.15);
  sideWindow.rotation.y = Math.PI / 2;
  house.add(sideWindow);

  const chimney = new THREE.Mesh(new THREE.BoxGeometry(0.28, 0.85, 0.28), brick);
  chimney.position.set(0.72, 2.15, 0.15);
  chimney.castShadow = true;
  house.add(chimney);

  return house;
}

function createMarker(hotspot: HouseHotspot): Marker {
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
