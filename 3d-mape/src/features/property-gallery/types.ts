import type { ImageCredit } from "@/features/map/types/map-location";

export type PropertyImage = {
  id: string;
  src: string;
  alt: string;
  roomLabel?: string;
  credit?: ImageCredit;
};

export type PropertyDetails = {
  price: string;
  area: string;
  bedrooms: number;
  bathrooms: number;
};

/** Photos are the only implemented mode. Panorama stays closed unless a real asset URL exists. */
export type PropertyViewMode = "photos" | "panorama";

export type Property = {
  id: string;
  locationId: string;
  title: string;
  location: string;
  images: PropertyImage[];
  details?: PropertyDetails;
  panoramaUrl?: string;
};
