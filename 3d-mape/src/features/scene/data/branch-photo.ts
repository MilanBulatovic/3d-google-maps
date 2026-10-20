/** Shown until a branch pin has its own photos. The first image starts in focus. */
export const BRANCH_DEMO_IMAGES = [
  "/properties/S8%20after.jpg",
  "/properties/vila-moraca-living.png",
  "/properties/kuca-varos-terrace.png",
  "/properties/stan-preko-bedroom.png",
];

export function branchPhotoUrls(imageUrl?: string): string[] {
  if (!imageUrl || BRANCH_DEMO_IMAGES.includes(imageUrl)) {
    return [...BRANCH_DEMO_IMAGES];
  }

  return [imageUrl, ...BRANCH_DEMO_IMAGES.slice(0, 3)];
}
