/** Killer-type keywords for `player_died` conditions. */
export const KILLER_TYPE_KEYWORDS = [
    "any",
    "none",
    "guardian",
    "enemy",
    "betrayal",
    "suicide",
] as const;

export type KillerTypeKeyword = (typeof KILLER_TYPE_KEYWORDS)[number];

/** Disposition keywords for `team_disposition` conditions. */
export const DISPOSITION_KEYWORDS = [
    "neutral",
    "friendly",
    "enemy",
] as const;

export type DispositionKeyword = (typeof DISPOSITION_KEYWORDS)[number];
