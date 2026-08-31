import { describe, expect, it } from "vitest";
import {
  isObjectListDocument,
  isObjectListsPath,
  isRecognizedObjectListName,
  pathFileName,
} from "./objectListsPath";

const NAMES = ["objects.txt", "weapons.txt", "vehicles.txt"] as const;

describe("objectListsPath", () => {
  it("detects paths under object_lists", () => {
    expect(isObjectListsPath("workspace/object_lists/notes.txt")).toBe(true);
    expect(isObjectListsPath(["object_lists", "objects.txt"])).toBe(true);
    expect(isObjectListsPath("scripts/foo.megalo")).toBe(false);
  });

  it("matches recognized list filenames case-insensitively", () => {
    expect(isRecognizedObjectListName("objects.txt", NAMES)).toBe(true);
    expect(isRecognizedObjectListName("Objects.TXT", NAMES)).toBe(true);
    expect(isRecognizedObjectListName("notes.txt", NAMES)).toBe(false);
  });

  it("only treats recognized files under object_lists as object list documents", () => {
    expect(isObjectListDocument("C:/ws/object_lists/objects.txt", NAMES)).toBe(
      true
    );
    expect(isObjectListDocument("C:/ws/object_lists/notes.txt", NAMES)).toBe(
      false
    );
    expect(isObjectListDocument("C:/ws/scripts/objects.txt", NAMES)).toBe(
      false
    );
    expect(pathFileName("C:/ws/object_lists/notes.txt")).toBe("notes.txt");
  });
});
