import { z } from "zod";

const googleMapsApiKeySchema = z.string().trim().min(1);

export function getGoogleMapsApiKey(): string | null {
  const parsed = googleMapsApiKeySchema.safeParse(
    process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY,
  );

  return parsed.success ? parsed.data : null;
}
