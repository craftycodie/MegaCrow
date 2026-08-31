/**
 * Fold ranges for Megalo element / statement blocks that terminate with `end`,
 * plus MegaCrow `;#region` comment regions.
 */

import { isRegionEndLine, isRegionStartLine } from "./regionComments";

/** Top-level elements and nested statement blocks that close with a lone `end`. */
const BLOCK_START =
  /^\s*(?:string_table|constants|variables|game_options|hud_widgets|loadout_palette|loadout|teams|team|engine_data|player_rating|map_permissions|game_stats|statistics|map_object|requisition_palette|trigger)\b/i;

/**
 * Nested action-scope blocks:
 * - `begin` / `action begin` (`action` optional)
 * - `action for_each …` (`action` required)
 */
const ACTION_BLOCK_START = /^\s*(?:(?:action\s+)?begin|action\s+for_each)\b/i;

/**
 * Game-option entry blocks may be prefixed with `hide` / `lock`
 * (e.g. `hide ranged_option flag_return_radius` … `end`).
 */
const GAME_OPTION_BLOCK_START =
  /^\s*(?:(?:hide|lock)\s+)*(?:player_traits|ranged_option|option)\b/i;

/**
 * Nested player-traits overrides are blocks (`override base_player_traits` … `end`).
 * Simple overrides (`override round_count 4`) stay on one line and must not fold.
 */
const OVERRIDE_BLOCK_START =
  /^\s*(?:(?:hide|lock)\s+)*override\s+[a-z_][a-z0-9_]*\s*(?:;.*)?$/i;

/** `end` alone on a line (optional trailing comment). */
const BLOCK_END = /^\s*end\s*(?:;.*)?$/i;

export function isMegaloBlockStartLine(line: string): boolean {
  const trimmed = line.trimStart();
  if (trimmed.startsWith(";")) {
    return false;
  }
  if (OVERRIDE_BLOCK_START.test(line)) {
    return true;
  }
  // Single-line `override … value` — not a block.
  if (/^\s*(?:(?:hide|lock)\s+)*override\b/i.test(line)) {
    return false;
  }
  return (
    ACTION_BLOCK_START.test(line) ||
    GAME_OPTION_BLOCK_START.test(line) ||
    BLOCK_START.test(line)
  );
}

export function isMegaloBlockEndLine(line: string): boolean {
  const trimmed = line.trimStart();
  if (trimmed.startsWith(";")) {
    return false;
  }
  return BLOCK_END.test(line);
}

export interface MegaloFoldRange {
  /** 1-based inclusive end line. */
  end: number;
  kind: "region" | "block";
  /** 1-based inclusive start line. */
  start: number;
}

/**
 * Compute fold ranges for region comments and `… end` blocks.
 * Nested blocks are supported via a stack.
 */
export function getMegaloFoldRanges(
  lines: readonly string[]
): MegaloFoldRange[] {
  const ranges: MegaloFoldRange[] = [];
  const regionStack: number[] = [];
  const blockStack: number[] = [];

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";

    if (isRegionEndLine(line)) {
      const start = regionStack.pop();
      if (start !== undefined && i > start) {
        ranges.push({ start: start + 1, end: i + 1, kind: "region" });
      }
      continue;
    }

    if (isRegionStartLine(line)) {
      regionStack.push(i);
      continue;
    }

    if (isMegaloBlockEndLine(line)) {
      const start = blockStack.pop();
      if (start !== undefined && i > start) {
        ranges.push({ start: start + 1, end: i + 1, kind: "block" });
      }
      continue;
    }

    if (isMegaloBlockStartLine(line)) {
      blockStack.push(i);
    }
  }

  return ranges;
}
