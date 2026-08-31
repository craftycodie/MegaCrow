import { describe, expect, it } from "vitest";
import {
  getMegaloFoldRanges,
  isMegaloBlockEndLine,
  isMegaloBlockStartLine,
} from "./megaloBlockFolding";

describe("megaloBlockFolding", () => {
  it("detects element and nested block openers", () => {
    expect(isMegaloBlockStartLine("string_table english")).toBe(true);
    expect(isMegaloBlockStartLine("  trigger local")).toBe(true);
    expect(isMegaloBlockStartLine("\tbegin")).toBe(true);
    expect(isMegaloBlockStartLine("\taction begin")).toBe(true);
    expect(isMegaloBlockStartLine("for_each player")).toBe(false);
    expect(isMegaloBlockStartLine("\taction for_each player")).toBe(true);
    expect(isMegaloBlockStartLine("; string_table english")).toBe(false);
    expect(isMegaloBlockStartLine('include "x.txt"')).toBe(false);
  });

  it("detects end lines", () => {
    expect(isMegaloBlockEndLine("end")).toBe(true);
    expect(isMegaloBlockEndLine("  end  ; done")).toBe(true);
    expect(isMegaloBlockEndLine("end = 1")).toBe(false);
    expect(isMegaloBlockEndLine("; end")).toBe(false);
  });

  it("folds top-level element blocks", () => {
    const lines = [
      "string_table english",
      '\tname "Custom Game"',
      "end",
      "engine_data",
      "\tname name",
      "end",
    ];
    expect(getMegaloFoldRanges(lines)).toEqual([
      { start: 1, end: 3, kind: "block" },
      { start: 4, end: 6, kind: "block" },
    ]);
  });

  it("folds nested begin/end inside triggers", () => {
    const lines = [
      "trigger local",
      "\tbegin",
      "\t\taction set_score global.number[0] = 1",
      "\tend",
      "end",
    ];
    expect(getMegaloFoldRanges(lines)).toEqual([
      { start: 2, end: 4, kind: "block" },
      { start: 1, end: 5, kind: "block" },
    ]);
  });

  it("folds action for_each and nested begin blocks", () => {
    const lines = [
      "trigger local",
      "\taction for_each player",
      "\t\tbegin",
      "\t\t\taction set_score current_player = 1",
      "\t\tend",
      "\tend",
      "end",
    ];
    expect(getMegaloFoldRanges(lines)).toEqual([
      { start: 3, end: 5, kind: "block" },
      { start: 2, end: 6, kind: "block" },
      { start: 1, end: 7, kind: "block" },
    ]);
  });

  it("does not treat single-line overrides as blocks", () => {
    expect(isMegaloBlockStartLine("\toverride round_count 4")).toBe(false);
    expect(
      isMegaloBlockStartLine("\toverride sudden_death_time_limit 15")
    ).toBe(false);
    expect(isMegaloBlockStartLine("\tlock override teams_enabled true")).toBe(
      false
    );
    expect(isMegaloBlockStartLine("\toverride base_player_traits")).toBe(true);
  });

  it("does not fold consecutive single-line overrides together", () => {
    const lines = [
      "game_options",
      "\toverride round_count 4",
      "\toverride round_time_limit 3",
      "",
      "\toverride score_to_win_round 1",
      "\toverride early_victory_win_count 0",
      "end",
    ];
    expect(getMegaloFoldRanges(lines)).toEqual([
      { start: 1, end: 7, kind: "block" },
    ]);
  });

  it("folds nested player_traits override blocks", () => {
    const lines = [
      "game_options",
      "\toverride base_player_traits",
      "\t\tshields 2",
      "\tend",
      "end",
    ];
    expect(getMegaloFoldRanges(lines)).toEqual([
      { start: 2, end: 4, kind: "block" },
      { start: 1, end: 5, kind: "block" },
    ]);
  });

  it("folds nested team blocks inside teams", () => {
    const lines = ["teams", "\tteam", "\t\t; foo", "\tend", "end"];
    expect(getMegaloFoldRanges(lines)).toEqual([
      { start: 2, end: 4, kind: "block" },
      { start: 1, end: 5, kind: "block" },
    ]);
  });

  it("folds hide/lock prefixed ranged_option and option blocks", () => {
    expect(
      isMegaloBlockStartLine("\thide ranged_option flag_return_radius")
    ).toBe(true);
    expect(isMegaloBlockStartLine("\tlock option foo")).toBe(true);
    expect(isMegaloBlockStartLine("\tranged_option bar")).toBe(true);

    const lines = [
      "game_options",
      "\thide ranged_option flag_return_radius",
      '\t\t""',
      '\t\t""',
      "\t\t7",
      "\t\t0",
      "\t\t500",
      "\tend",
      "end",
    ];
    expect(getMegaloFoldRanges(lines)).toEqual([
      { start: 2, end: 8, kind: "block" },
      { start: 1, end: 9, kind: "block" },
    ]);
  });

  it("keeps ;#region folds alongside element blocks", () => {
    const lines = [
      ";#region STRINGS",
      "string_table english",
      '\tname "A"',
      "end",
      ";#endregion",
    ];
    expect(getMegaloFoldRanges(lines)).toEqual([
      { start: 2, end: 4, kind: "block" },
      { start: 1, end: 5, kind: "region" },
    ]);
  });
});
