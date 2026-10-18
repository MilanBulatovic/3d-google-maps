import { MARKER_ALTITUDE_METERS } from "@/features/map/config/camera";
import type { Maps3dRuntime } from "@/features/map/services/google-maps-loader";
import type { MapLocation } from "@/features/map/types/map-location";

const UNSELECTED_PIN = {
  borderColor: "#f5f0e8",
  glyphColor: "#f5f0e8",
  scale: 1,
  zIndex: 1,
  collisionPriority: 1,
} as const;

const CATEGORY_COLORS: Record<string, string> = {
  Vrtić: "#0f766e",
  Rođendaonica: "#be185d",
  "Dječija radionica": "#6d28d9",
  Igralište: "#3f6212",
  Nekretnine: "#1d4ed8",
  Policija: "#1e3a8a",
  Vatrogasci: "#b91c1c",
  "Hitna pomoć": "#be123c",
  Bolnica: "#0e7490",
  "Gorska služba": "#0369a1",
  "Spasilačka služba": "#155e75",
  Residence: "#92400e",
};

const SELECTED_PIN = {
  background: "#c2410c",
  borderColor: "#fff7ed",
  glyphColor: "#fff7ed",
  scale: 1.45,
  zIndex: 20,
  collisionPriority: 20,
} as const;

export type MarkerRecord = {
  id: string;
  category: string;
  pinStyle: MapLocation["pinStyle"];
  marker: google.maps.maps3d.Marker3DInteractiveElement;
  pin: google.maps.marker.PinElement;
  onClick: (event: Event) => void;
};

function pinBackground(
  pinStyle: MapLocation["pinStyle"],
  category: string,
  selected: boolean,
): string {
  if (selected) {
    return SELECTED_PIN.background;
  }

  if (pinStyle === "model") {
    return "#9a3412";
  }

  if (pinStyle === "plain") {
    return "#44403c";
  }

  return CATEGORY_COLORS[category] ?? "#1c1917";
}

export function createLocationMarker(
  location: MapLocation,
  runtime: Pick<Maps3dRuntime, "Marker3DInteractiveElement" | "PinElement">,
  onSelect: (id: string) => void,
): MarkerRecord {
  const pin = new runtime.PinElement({
    background: pinBackground(location.pinStyle, location.category, false),
    borderColor: UNSELECTED_PIN.borderColor,
    glyphColor: UNSELECTED_PIN.glyphColor,
    scale: location.pinStyle === "model" ? 1.2 : UNSELECTED_PIN.scale,
  });

  const marker = new runtime.Marker3DInteractiveElement({
    position: {
      lat: location.latitude,
      lng: location.longitude,
      altitude: MARKER_ALTITUDE_METERS,
    },
    altitudeMode: "RELATIVE_TO_GROUND",
    extruded: true,
    drawsWhenOccluded: true,
    sizePreserved: true,
    label: location.name,
    title: `${location.name}, ${location.category}`,
    zIndex: UNSELECTED_PIN.zIndex,
    collisionPriority: UNSELECTED_PIN.collisionPriority,
  });

  marker.replaceChildren(pin);

  const onClick = (event: Event) => {
    event.stopPropagation();
    onSelect(location.id);
  };

  marker.addEventListener("gmp-click", onClick);

  return {
    id: location.id,
    category: location.category,
    pinStyle: location.pinStyle,
    marker,
    pin,
    onClick,
  };
}

export function applyMarkerAppearance(
  record: MarkerRecord,
  selected: boolean,
): void {
  const appearance = selected ? SELECTED_PIN : UNSELECTED_PIN;
  record.pin.background = pinBackground(
    record.pinStyle,
    record.category,
    selected,
  );
  record.pin.borderColor = appearance.borderColor;
  record.pin.glyphColor = appearance.glyphColor;
  record.pin.scale = selected
    ? appearance.scale
    : record.pinStyle === "model"
      ? 1.2
      : appearance.scale;
  record.marker.zIndex = appearance.zIndex;
  record.marker.collisionPriority = appearance.collisionPriority;
}

export function removeLocationMarker(record: MarkerRecord): void {
  record.marker.removeEventListener("gmp-click", record.onClick);
  record.marker.remove();
}
