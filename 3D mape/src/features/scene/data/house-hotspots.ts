export const FLOOR_HEIGHT = 1.3;
export const FACADE_Z = 1.08;
/** How far a selected story slides out of the building, in world units. */
export const FLOOR_PULL = 2.45;

export type FloorView = "outside" | "extracted" | "inside";

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
    title: "Prizemlje",
    detail: "Klik izvlači sprat ispred zgrade. Još jedan klik ulazi u stan.",
    position: [0, 0.78, 1.58],
  },
  {
    id: "first",
    level: 1,
    title: "Prvi sprat",
    detail: "Klik izvlači sprat ispred zgrade. Još jedan klik ulazi u stan.",
    position: [0, FLOOR_HEIGHT + 0.82, 1.7],
  },
  {
    id: "second",
    level: 2,
    title: "Drugi sprat",
    detail: "Klik izvlači sprat ispred zgrade. Još jedan klik ulazi u stan.",
    position: [0, FLOOR_HEIGHT * 2 + 0.82, 1.7],
  },
];
