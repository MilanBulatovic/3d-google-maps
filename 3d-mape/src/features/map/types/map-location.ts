export type ImageCredit = {
  author: string;
  authorUrl: string;
  license: string;
  licenseUrl: string;
};

export type PlaceDataSource = "openstreetmap" | "google";

export type MapLocation = {
  id: string;
  name: string;
  category: string;
  description: string;
  latitude: number;
  longitude: number;
  altitude?: number;
  imageUrl?: string;
  imageCredit?: ImageCredit;
  /** Who supplied the place name or coordinates shown in the card. */
  dataSource?: PlaceDataSource;
  address?: string;
  tags?: string[];
  metadata?: Record<string, string | number | boolean>;
  /** When set, selection flies to this country or city scale instead of the close bird's-eye. */
  viewRange?: number;
  viewTilt?: number;
  /** Plain pins only reveal a label. Model pins also open the building scene. */
  pinStyle?: "plain" | "model";
};
