import { describe, expect, it } from "vitest";
import { type GithubReleaseInfo, selectUpdateRelease } from "./updateCheck";

const release = (tagName: string, prerelease: boolean): GithubReleaseInfo => ({
  tagName,
  htmlUrl: `https://github.com/craftycodie/MegaCrow/releases/tag/${tagName}`,
  name: tagName,
  prerelease,
});

describe("selectUpdateRelease", () => {
  const olderStable = release("00020.26.08.10.1200.release", false);
  const currentAlpha = "00023.26.08.16.1810.alpha";
  const newerPrerelease = release("00024.26.08.17.1810.alpha", true);
  const newerStable = release("00025.26.08.18.0900.release", false);

  it("shows a newer GitHub pre-release on a non-release branch", () => {
    expect(
      selectUpdateRelease([olderStable, newerPrerelease], currentAlpha)
    ).toEqual(newerPrerelease);
  });

  it("ignores pre-releases on a release-branch build", () => {
    expect(
      selectUpdateRelease([newerPrerelease], "00023.26.08.16.1810.release")
    ).toBeNull();
  });

  it("still offers a newer full release on a non-release branch", () => {
    expect(
      selectUpdateRelease([olderStable, newerStable], currentAlpha)
    ).toEqual(newerStable);
  });

  it("picks the highest seq among eligible releases", () => {
    expect(
      selectUpdateRelease(
        [newerPrerelease, newerStable, olderStable],
        currentAlpha
      )
    ).toEqual(newerStable);
  });

  it("returns null when the current build is already newest", () => {
    expect(
      selectUpdateRelease(
        [olderStable, newerPrerelease],
        newerPrerelease.tagName
      )
    ).toBeNull();
  });
});
