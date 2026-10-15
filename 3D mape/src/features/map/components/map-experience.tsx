"use client";

import dynamic from "next/dynamic";

import { MapLoading } from "@/features/map/components/map-loading";

const InteractiveMap = dynamic(
  () =>
    import("@/features/map/components/interactive-map").then(
      (module) => module.InteractiveMap,
    ),
  {
    ssr: false,
    loading: () => <MapLoading />,
  },
);

export function MapExperience() {
  return <InteractiveMap />;
}
