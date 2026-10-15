import { z } from "zod";

import type { Property } from "@/features/property-gallery/types";

const propertyImageSchema = z.object({
  id: z.string().trim().min(1),
  src: z.string().trim().min(1),
  alt: z.string().trim().min(1),
  roomLabel: z.string().trim().min(1).optional(),
});

const propertySchema = z.object({
  id: z.string().trim().min(1),
  locationId: z.string().trim().min(1),
  title: z.string().trim().min(1),
  location: z.string().trim().min(1),
  images: z.array(propertyImageSchema),
  details: z
    .object({
      price: z.string().trim().min(1),
      area: z.string().trim().min(1),
      bedrooms: z.number().int().nonnegative(),
      bathrooms: z.number().int().nonnegative(),
    })
    .optional(),
  panoramaUrl: z.url().optional(),
});

const propertyInput = [
  {
    id: "vila-moraca",
    locationId: "vila-moraca",
    title: "Vila na Morači",
    location: "Kralja Nikole, Podgorica",
    details: {
      price: "€420,000",
      area: "148 m²",
      bedrooms: 3,
      bathrooms: 2,
    },
    images: [
      {
        id: "vila-moraca-living",
        src: "/properties/vila-moraca-living.png",
        alt: "Living room at Vila na Morači",
        roomLabel: "Living Room",
      },
      {
        id: "vila-moraca-kitchen",
        src: "/properties/vila-moraca-kitchen.png",
        alt: "Kitchen at Vila na Morači",
        roomLabel: "Kitchen",
      },
      {
        id: "vila-moraca-bedroom",
        src: "/properties/vila-moraca-bedroom.png",
        alt: "Bedroom at Vila na Morači",
        roomLabel: "Bedroom",
      },
      {
        id: "vila-moraca-terrace",
        src: "/properties/vila-moraca-terrace.png",
        alt: "Terrace at Vila na Morači",
        roomLabel: "Terrace",
      },
    ],
  },
  {
    id: "stan-preko-morace",
    locationId: "stan-preko-morace",
    title: "Stan na Preko Morači",
    location: "Preko Morače, Podgorica",
    details: {
      price: "€265,000",
      area: "86 m²",
      bedrooms: 2,
      bathrooms: 1,
    },
    images: [
      {
        id: "stan-preko-living",
        src: "/properties/stan-preko-living.png",
        alt: "Living room at Stan na Preko Morači",
        roomLabel: "Living Room",
      },
      {
        id: "stan-preko-kitchen",
        src: "/properties/stan-preko-kitchen.png",
        alt: "Kitchen at Stan na Preko Morači",
        roomLabel: "Kitchen",
      },
      {
        id: "stan-preko-bedroom",
        src: "/properties/stan-preko-bedroom.png",
        alt: "Bedroom at Stan na Preko Morači",
        roomLabel: "Bedroom",
      },
      {
        id: "stan-preko-terrace",
        src: "/properties/stan-preko-terrace.png",
        alt: "Terrace at Stan na Preko Morači",
      },
    ],
  },
  {
    id: "kuca-stara-varos",
    locationId: "kuca-stara-varos",
    title: "Kuća u Staroj varoši",
    location: "Stara varoš, Podgorica",
    images: [
      {
        id: "kuca-varos-living",
        src: "/properties/kuca-varos-living.png",
        alt: "Living room at Kuća u Staroj varoši",
        roomLabel: "Living Room",
      },
      {
        id: "kuca-varos-kitchen",
        src: "/properties/kuca-varos-kitchen.png",
        alt: "Kitchen at Kuća u Staroj varoši",
        roomLabel: "Kitchen",
      },
      {
        id: "kuca-varos-bedroom",
        src: "/properties/kuca-varos-bedroom.png",
        alt: "Bedroom at Kuća u Staroj varoši",
        roomLabel: "Bedroom",
      },
      {
        id: "kuca-varos-terrace",
        src: "/properties/kuca-varos-terrace.png",
        alt: "Terrace at Kuća u Staroj varoši",
        roomLabel: "Terrace",
      },
    ],
  },
] as const;

export const PROPERTIES: Property[] = z.array(propertySchema).parse(propertyInput);

const propertiesByLocation = new Map(
  PROPERTIES.map((property) => [property.locationId, property]),
);

export function getPropertyByLocationId(locationId: string): Property | null {
  return propertiesByLocation.get(locationId) ?? null;
}

export function propertyHasPanorama(
  property: Pick<Property, "panoramaUrl">,
): boolean {
  return typeof property.panoramaUrl === "string" && property.panoramaUrl.length > 0;
}
