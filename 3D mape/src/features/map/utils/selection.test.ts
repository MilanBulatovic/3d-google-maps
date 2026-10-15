import { describe, expect, it } from "vitest";

import { applySelection } from "@/features/map/utils/selection";

const ids = ["millennium-bridge", "sahat-kula"];

describe("applySelection", () => {
  it("selects a known place and replaces the previous selection", () => {
    expect(applySelection(null, { type: "select", id: "millennium-bridge" }, ids)).toBe(
      "millennium-bridge",
    );
    expect(
      applySelection(
        "millennium-bridge",
        { type: "select", id: "sahat-kula" },
        ids,
      ),
    ).toBe("sahat-kula");
  });

  it("keeps the current selection when the id is unknown", () => {
    expect(
      applySelection("sahat-kula", { type: "select", id: "missing" }, ids),
    ).toBe("sahat-kula");
  });

  it("clears the selection", () => {
    expect(applySelection("sahat-kula", { type: "clear" }, ids)).toBeNull();
  });
});
