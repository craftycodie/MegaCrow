/** Built-in override options whose value is a nested player_traits body. */
export const PLAYER_TRAITS_OVERRIDE_OPTIONS = [
    "base_player_traits",
    "respawn_traits",
    "red_powerup_traits",
    "blue_powerup_traits",
    "yellow_powerup_traits",
] as const;

export type PlayerTraitsOverrideOption = (typeof PLAYER_TRAITS_OVERRIDE_OPTIONS)[number];

/** Built-in override options that are not numeric game-option symbols. */
export const BUILT_IN_NON_NUMERIC_OVERRIDE_OPTIONS = [
    ...PLAYER_TRAITS_OVERRIDE_OPTIONS,
    "weapon_set",
    "vehicle_set",
    "loadout_palette",
] as const;

export type BuiltInNonNumericOverrideOption = (typeof BUILT_IN_NON_NUMERIC_OVERRIDE_OPTIONS)[number];

export const isPlayerTraitsOverrideOption = (value: string): value is PlayerTraitsOverrideOption =>
    (PLAYER_TRAITS_OVERRIDE_OPTIONS as readonly string[]).includes(value);

export const isBuiltInNonNumericOverrideOption = (value: string): value is BuiltInNonNumericOverrideOption =>
    (BUILT_IN_NON_NUMERIC_OVERRIDE_OPTIONS as readonly string[]).includes(value);
