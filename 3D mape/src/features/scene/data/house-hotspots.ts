export const FLOOR_HEIGHT = 1.3;
export const FACADE_Z = 1.08;

export type FloorHotspot = {
  id: "ground" | "first" | "second";
  title: string;
  detail: string;
  level: 0 | 1 | 2;
  position: readonly [number, number, number];
};

export const FLOOR_HOTSPOTS: FloorHotspot[] = [
  {
    id: "ground",
    level: 0,
    title: "Ground floor",
    detail: "The camera goes through the open door into the apartment.",
    position: [0, 0.78, 1.58],
  },
  {
    id: "first",
    level: 1,
    title: "First floor",
    detail: "The camera goes through the balcony door into the apartment.",
    position: [0, FLOOR_HEIGHT + 0.82, 1.7],
  },
  {
    id: "second",
    level: 2,
    title: "Second floor",
    detail: "The camera goes through the balcony door into the apartment.",
    position: [0, FLOOR_HEIGHT * 2 + 0.82, 1.7],
  },
];
