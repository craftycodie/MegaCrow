import { describe, expect, it } from "vitest";
import {
  canNavigateFileNavBack,
  canNavigateFileNavForward,
  EMPTY_FILE_NAV,
  navigateFileNavBack,
  navigateFileNavForward,
  pushFileNavEntry,
  sourceNavEntry,
} from "./fileNavigation";

describe("fileNavigation", () => {
  it("pushes opens and supports back/forward", () => {
    let state = EMPTY_FILE_NAV;
    state = pushFileNavEntry(state, sourceNavEntry("a", "a.txt"));
    state = pushFileNavEntry(state, sourceNavEntry("b", "b.txt"), "a-edited");
    expect(state.entries).toHaveLength(2);
    expect(state.entries[0]?.text).toBe("a-edited");
    expect(canNavigateFileNavBack(state)).toBe(true);
    expect(canNavigateFileNavForward(state)).toBe(false);

    const back = navigateFileNavBack(state, "b-edited");
    expect(back?.entry.displayName).toBe("a.txt");
    expect(back?.state.entries[1]?.text).toBe("b-edited");
    state = back!.state;
    expect(canNavigateFileNavForward(state)).toBe(true);

    const forward = navigateFileNavForward(state);
    expect(forward?.entry.displayName).toBe("b.txt");
    expect(forward?.entry.text).toBe("b-edited");
  });

  it("does not duplicate the current file", () => {
    let state = pushFileNavEntry(
      EMPTY_FILE_NAV,
      sourceNavEntry("a", "a.txt", { absoluteFilePath: "C:/a.txt" })
    );
    state = pushFileNavEntry(
      state,
      sourceNavEntry("a2", "a.txt", { absoluteFilePath: "C:/a.txt" })
    );
    expect(state.entries).toHaveLength(1);
    expect(state.entries[0]?.text).toBe("a2");
  });
});
