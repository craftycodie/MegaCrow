/**
 * MegaCrow editor extension: collapsible `;#region` / `;#endregion` comment blocks.
 *
 * These markers are not part of official Reach Megalo syntax. The compiler treats
 * them as ordinary semicolon comments; MegaCrow uses them only for IDE folding.
 */
export const REGION_START = /^\s*;\s*#region\b/i;
export const REGION_END = /^\s*;\s*#endregion\b/i;

export function regionStartPattern(regionName: string): RegExp {
  const escaped = regionName.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return new RegExp(`^\\s*;\\s*#region\\s+${escaped}\\b`, "i");
}

export function isRegionStartLine(line: string): boolean {
  return REGION_START.test(line);
}

export function isRegionEndLine(line: string): boolean {
  return REGION_END.test(line);
}
