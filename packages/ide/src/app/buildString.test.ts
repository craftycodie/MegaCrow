import { describe, expect, it } from "vitest";
import {
  isNewerBuild,
  isReleaseBranchBuild,
  parseBuildBranch,
  parseBuildSeq,
} from "./buildString";

describe("parseBuildSeq", () => {
  it("parses zero-padded seq from a build tag", () => {
    expect(parseBuildSeq("00042.26.08.15.0534.alpha")).toBe(42);
  });

  it("returns null for untracked builds", () => {
    expect(parseBuildSeq("untracked version")).toBeNull();
  });
});

describe("parseBuildBranch", () => {
  it("reads the branch suffix", () => {
    expect(parseBuildBranch("00023.26.08.16.1810.alpha")).toBe("alpha");
    expect(parseBuildBranch("00024.26.08.17.1810.release")).toBe("release");
  });

  it("returns null for untracked builds", () => {
    expect(parseBuildBranch("untracked version")).toBeNull();
  });
});

describe("isReleaseBranchBuild", () => {
  it("is true only for the release branch suffix", () => {
    expect(isReleaseBranchBuild("00024.26.08.17.1810.release")).toBe(true);
    expect(isReleaseBranchBuild("00023.26.08.16.1810.alpha")).toBe(false);
    expect(isReleaseBranchBuild("untracked version")).toBe(false);
  });
});

describe("isNewerBuild", () => {
  it("compares seq only", () => {
    expect(
      isNewerBuild("00043.26.08.15.1000.main", "00042.26.08.14.0900.alpha")
    ).toBe(true);
    expect(
      isNewerBuild("00041.26.08.15.1000.main", "00042.26.08.14.0900.alpha")
    ).toBe(false);
  });

  it("returns false when either side is untracked", () => {
    expect(isNewerBuild("00043.26.08.15.1000.main", "untracked version")).toBe(
      false
    );
  });
});
