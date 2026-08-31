import { describe, expect, it } from "vitest";
import {
  editingKitProjectRootPath,
  editingKitToolExePath,
  guessEditingKitRootFromWorkspacePaths,
  isPathInWorkspaceInput,
  parseProjectXmlDisplayName,
} from "./workspacePaths";

describe("isPathInWorkspaceInput", () => {
  it("accepts files under the workspace input root", () => {
    expect(
      isPathInWorkspaceInput(
        "C:\\HREK\\data\\multiplayer\\megalo\\foo.txt",
        "C:\\HREK\\data\\multiplayer\\megalo"
      )
    ).toBe(true);
    expect(
      isPathInWorkspaceInput(
        "C:/HREK/data/multiplayer/megalo/sub/bar.txt",
        "C:/HREK/data/multiplayer/megalo"
      )
    ).toBe(true);
  });

  it("rejects files outside the workspace", () => {
    expect(
      isPathInWorkspaceInput(
        "C:\\HREK\\maps\\megalo\\foo.txt",
        "C:\\HREK\\data\\multiplayer\\megalo"
      )
    ).toBe(false);
    expect(
      isPathInWorkspaceInput(
        "C:\\HREK\\data\\multiplayer\\megalo_other\\foo.txt",
        "C:\\HREK\\data\\multiplayer\\megalo"
      )
    ).toBe(false);
  });
});

describe("guessEditingKitRootFromWorkspacePaths", () => {
  it("returns the kit root for matching HREK input/output paths", () => {
    expect(
      guessEditingKitRootFromWorkspacePaths(
        "C:\\HREK\\data\\multiplayer\\megalo",
        "C:\\HREK\\maps\\megalo"
      )
    ).toBe("C:\\HREK");
    expect(
      guessEditingKitRootFromWorkspacePaths(
        "D:/Games/HREK/data/multiplayer/megalo",
        "D:/Games/HREK/maps/megalo"
      )
    ).toBe("D:/Games/HREK");
  });

  it("rejects mismatched roots or non-kit layouts", () => {
    expect(
      guessEditingKitRootFromWorkspacePaths(
        "C:\\HREK\\data\\multiplayer\\megalo",
        "C:\\Other\\maps\\megalo"
      )
    ).toBeUndefined();
    expect(
      guessEditingKitRootFromWorkspacePaths(
        "C:\\HREK\\scripts",
        "C:\\HREK\\maps\\megalo"
      )
    ).toBeUndefined();
    expect(
      guessEditingKitRootFromWorkspacePaths(
        "C:\\HREK\\data\\multiplayer\\megalo",
        null
      )
    ).toBeUndefined();
  });
});

describe("editingKit paths", () => {
  it("joins tool.exe and project.root under the kit root", () => {
    expect(editingKitToolExePath("C:\\HREK")).toBe("C:\\HREK\\tool.exe");
    expect(editingKitProjectRootPath("C:\\HREK")).toBe(
      "C:\\HREK\\project.root"
    );
  });
});

describe("parseProjectXmlDisplayName", () => {
  it("prefers displayName over name", () => {
    expect(
      parseProjectXmlDisplayName(`<project
	name="Bulgogi"
	displayName="Omaha"
	>`)
    ).toBe("Omaha");
  });

  it("falls back to name when displayName is missing", () => {
    expect(parseProjectXmlDisplayName(`<project name="Bulgogi">`)).toBe(
      "Bulgogi"
    );
  });
});
