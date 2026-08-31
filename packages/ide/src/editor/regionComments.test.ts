import { describe, expect, it } from "vitest";
import {
  isRegionEndLine,
  isRegionStartLine,
  regionStartPattern,
} from "./regionComments";

describe("MegaCrow region comment extension", () => {
  it("recognizes ;#region and ;#endregion markers", () => {
    expect(isRegionStartLine(";#region STRINGS")).toBe(true);
    expect(isRegionStartLine("  ;#region OPTIONS")).toBe(true);
    expect(isRegionEndLine(";#endregion")).toBe(true);
    expect(isRegionStartLine(";region TEAMS")).toBe(false);
    expect(isRegionStartLine("  ; region OPTIONS")).toBe(false);
    expect(isRegionEndLine(";endregion")).toBe(false);
    expect(isRegionStartLine(";* TEAMS *")).toBe(false);
  });

  it("finds named region fold lines with # markers only", () => {
    const lines = [
      ";region TEAMS",
      "teams",
      "end",
      ";endregion",
      ";#region STRINGS",
      "string_table english",
      "end",
      ";#endregion",
    ];
    const stringsFoldLines = lines
      .map((line, index) =>
        regionStartPattern("STRINGS").test(line) ? index + 1 : null
      )
      .filter((line): line is number => line !== null);
    expect(regionStartPattern("TEAMS").test(";region TEAMS")).toBe(false);
    expect(stringsFoldLines).toEqual([5]);
    expect(regionStartPattern("STRINGS").test(";#region STRINGS")).toBe(true);
    expect(regionStartPattern("STRINGS").test("; region STRINGS")).toBe(false);
  });
});
