import { z } from "zod";

import type { MapLocation } from "@/features/map/types/map-location";

function httpUrl(value: string): boolean {
  if (!URL.canParse(value)) {
    return false;
  }

  const protocol = new URL(value).protocol;
  return protocol === "https:" || protocol === "http:";
}

const imageCreditSchema = z.object({
  author: z.string().trim().min(1),
  authorUrl: z.string().trim().refine(httpUrl, "Author link must be an http(s) URL"),
  license: z.string().trim().min(1),
  licenseUrl: z.string().trim().refine(httpUrl, "License link must be an http(s) URL"),
});

const metadataSchema = z.record(
  z.string(),
  z.union([z.string(), z.number(), z.boolean()]),
);

export const mapLocationSchema = z.object({
  id: z.string().trim().min(1),
  name: z.string().trim().min(1),
  category: z.string().trim().min(1),
  description: z.string().trim().min(1),
  latitude: z.number().finite().min(-90).max(90),
  longitude: z.number().finite().min(-180).max(180),
  altitude: z.number().finite().optional(),
  imageUrl: z
    .string()
    .trim()
    .min(1)
    .refine(
      (value) => value.startsWith("/") || URL.canParse(value),
      "Image must be an absolute URL or a public path",
    )
    .optional(),
  imageCredit: imageCreditSchema.optional(),
  dataSource: z.enum(["openstreetmap", "google"]).optional(),
  address: z.string().trim().min(1).optional(),
  tags: z.array(z.string().trim().min(1)).optional(),
  metadata: metadataSchema.optional(),
  viewRange: z.number().finite().positive().optional(),
  viewTilt: z.number().finite().min(0).max(90).optional(),
  pinStyle: z.enum(["plain", "model"]).optional(),
});

export const mapLocationsSchema = z
  .array(mapLocationSchema)
  .min(1)
  .superRefine((locations, context) => {
    const seen = new Set<string>();

    locations.forEach((location, index) => {
      if (seen.has(location.id)) {
        context.addIssue({
          code: "custom",
          message: `Duplicate location id: ${location.id}`,
          path: [index, "id"],
        });
      }

      seen.add(location.id);
    });
  });

export function isValidCoordinate(latitude: number, longitude: number): boolean {
  return mapLocationSchema
    .pick({ latitude: true, longitude: true })
    .safeParse({ latitude, longitude }).success;
}

export function parseMapLocations(input: unknown): MapLocation[] {
  return mapLocationsSchema.parse(input);
}
