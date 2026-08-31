import { describe, expect, it } from "vitest";
import { baseSourcePathCandidates } from "./openPathReference";
import { findPathReferences } from "./pathReferences";

describe("findPathReferences", () => {
  it("finds include and base quoted paths", () => {
    const source = `include "shared.txt"
localized_include "strings/en.txt"
base "foo.mglo"
`;
    const refs = findPathReferences(source);
    expect(refs.map((r) => [r.kind, r.path])).toEqual([
      ["include", "shared.txt"],
      ["localized_include", "strings/en.txt"],
      ["base", "foo.mglo"],
    ]);
    expect(refs[0]?.range.startColumn).toBe(source.indexOf('"shared.txt"') + 1);
  });
});

describe("baseSourcePathCandidates", () => {
  it("maps .mglo to sibling .txt", () => {
    expect(baseSourcePathCandidates("modes/base.mglo")).toEqual([
      "modes/base.txt",
    ]);
  });

  it("keeps .txt paths", () => {
    expect(baseSourcePathCandidates("modes/base.txt")).toEqual([
      "modes/base.txt",
    ]);
  });
});
