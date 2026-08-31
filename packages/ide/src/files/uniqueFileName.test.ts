import { describe, expect, it } from "vitest";
import {
  allocateNumberedName,
  numberedFileName,
  splitStemAndExt,
} from "./uniqueFileName";

describe("uniqueFileName", () => {
  it("splits a text file stem and extension", () => {
    expect(splitStemAndExt("script.txt")).toEqual({
      stem: "script",
      ext: ".txt",
    });
  });

  it("keeps directory names intact", () => {
    expect(splitStemAndExt("maps.v1", { directory: true })).toEqual({
      stem: "maps.v1",
      ext: "",
    });
  });

  it("appends (1) before the extension", () => {
    expect(numberedFileName("script.txt", 1)).toBe("script (1).txt");
    expect(numberedFileName("folder", 2, { directory: true })).toBe(
      "folder (2)"
    );
  });

  it("returns the desired name when it is free", async () => {
    expect(await allocateNumberedName("a.txt", () => false)).toBe("a.txt");
  });

  it("skips occupied numbered names", async () => {
    const taken = new Set(["a.txt", "a (1).txt"]);
    expect(await allocateNumberedName("a.txt", (name) => taken.has(name))).toBe(
      "a (2).txt"
    );
  });
});
