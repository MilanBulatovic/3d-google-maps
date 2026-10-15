import { describe, expect, it } from "vitest";

import { isInMontenegro } from "@/features/map/data/montenegro-outline";

describe("isInMontenegro", () => {
  it("keeps towns in Montenegro and drops neighbours", () => {
    expect(isInMontenegro(42.441, 19.263)).toBe(true);
    expect(isInMontenegro(41.929, 19.224)).toBe(true);
    expect(isInMontenegro(42.069, 19.512)).toBe(false);
    expect(isInMontenegro(42.214, 19.436)).toBe(false);
    expect(isInMontenegro(42.3303, 19.4206)).toBe(false);
    expect(isInMontenegro(42.3298, 19.4187)).toBe(true);
  });
});
