export type HouseHotspot = {
  id: "entrance" | "window" | "wall";
  title: string;
  detail: string;
  position: readonly [number, number, number];
};

export const HOUSE_HOTSPOTS: HouseHotspot[] = [
  {
    id: "entrance",
    title: "Entrance",
    detail: "The camera moves through the open door into the room.",
    position: [-0.53, 0.72, 1.45],
  },
  {
    id: "window",
    title: "Front window",
    detail: "The camera passes through the window into the room.",
    position: [0.63, 0.9, 1.45],
  },
  {
    id: "wall",
    title: "Side wall",
    detail: "The camera goes through the side wall into the room.",
    position: [1.7, 0.78, 0.05],
  },
];
