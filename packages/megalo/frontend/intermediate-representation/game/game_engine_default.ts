import { ValueWithLocation } from "..";
import { ContentItemMetadata } from "../saved_games/saved_game_files";
import { GrenadeCountSetting, PlayerTraits } from "./game_engine_player_traits";
import { StringTableEntry, StringTableReference } from "./string_table";

export type GameEngineMiscellaneousOptions = Partial<{
    teamsEnabled: ValueWithLocation<boolean>;
    roundResetPlayers: ValueWithLocation<boolean>;
    roundResetMap: ValueWithLocation<boolean>;
    perfectionEnabled: ValueWithLocation<boolean>;
    roundTimeLimitMinutes: ValueWithLocation<number>;
    roundCount: ValueWithLocation<number>;
    earlyVictoryWinCount: ValueWithLocation<number>;
    suddenDeathTimeLimitSeconds: ValueWithLocation<number>;
    gracePeriodTimeLimitSeconds: ValueWithLocation<number>;
}>;

export type GameEngineRespawnOptions = Partial<{
    inheritRespawnTime: ValueWithLocation<boolean>;
    respawnWithTeammate: ValueWithLocation<boolean>;
    respawnAtLocation: ValueWithLocation<boolean>;
    respawnOnKills: ValueWithLocation<boolean>;
    livesPerRound: ValueWithLocation<number>;
    teamLivesPerRound: ValueWithLocation<number>;
    respawnTimeSeconds: ValueWithLocation<number>;
    suicidePenaltySeconds: ValueWithLocation<number>;
    betrayalPenaltySeconds: ValueWithLocation<number>;
    respawnGrowthSeconds: ValueWithLocation<number>;
    loadoutCamTime: ValueWithLocation<number>;
    respawnPlayerTraitsDurationSeconds: ValueWithLocation<number>;
    respawnPlayerTraits: PlayerTraits[];
}>;

export enum TeamScoringMethod {
    Sum = 0,
    Minimum = 1,
    Maximum = 2,
}

export type GameEngineSocialOptions = Partial<{
    friendlyFireEnabled: ValueWithLocation<boolean>;
    betrayalBootingEnabled: ValueWithLocation<boolean>;
    enemyVoiceEnabled: ValueWithLocation<boolean>;
    openChannelVoiceEnabled: ValueWithLocation<boolean>;
    deadPlayerVoiceEnabled: ValueWithLocation<boolean>;
}>;

export type GameEngineMapOverrideOptions = Partial<{
    grenadesOnMap: ValueWithLocation<boolean>;
    shortcutsOnMap: ValueWithLocation<boolean>;
    equipmentOnMap: ValueWithLocation<boolean>;
    powerupsOnMap: ValueWithLocation<boolean>;
    turretsOnMap: ValueWithLocation<boolean>;
    indestructibleVehicles: ValueWithLocation<boolean>;
    basePlayerTraits: PlayerTraits;
    weaponSetAbsoluteIndex: ValueWithLocation<number>; // object_lists/weapon_sets.txt
    vehicleSetAbsoluteIndex: ValueWithLocation<number>; // object_lists/vehicle_sets.txt
    redPowerupTraits: PlayerTraits;
    bluePowerupTraits: PlayerTraits;
    yellowPowerupTraits: PlayerTraits;
    redPowerupDurationSeconds: ValueWithLocation<number>;
    bluePowerupDurationSeconds: ValueWithLocation<number>;
    yellowPowerupDurationSeconds: ValueWithLocation<number>;
}>;

export enum MultiplayerTeamDesignator {
    Defenders = 0,
    Attackers = 1,
    ThirdParty = 2,
    FourthParty = 3,
    FifthParty = 4,
    SixthParty = 5,
    SeventhParty = 6,
    EighthParty = 7,
    Neutral = 8,
}

export enum PlayerModelChoice {
    Spartan = 0,
    Elite = 1,
}

export type Color = {
    r: number;
    g: number;
    b: number;
}

export type GameEngineTeamOptionsTeam = Partial<{
    name: ValueWithLocation<StringTableEntry>;
    designator: ValueWithLocation<MultiplayerTeamDesignator>;
    model: ValueWithLocation<PlayerModelChoice>;
    teamColor: ValueWithLocation<Color>;
    fireteamCount: ValueWithLocation<number>;
}>;

export enum DesignatorSwitchType {
    None = 0,
    Random = 1,
    Rotate = 2,
}

export type GameEngineTeamOptions = Partial<{
    model: ValueWithLocation<PlayerModelChoice>;
    designatorSwitchType: ValueWithLocation<DesignatorSwitchType>;
    teams: GameEngineTeamOptionsTeam[];
}>;

export type LoadoutTraits = Partial<{
    name: StringTableReference; // Index in string table
    initialPrimaryWeaponAbsoluteIndex: ValueWithLocation<number>; // object_lists/weapons.txt
    initialSecondaryWeaponAbsoluteIndex: ValueWithLocation<number>; // object_lists/weapons.txt
    initialEquipmentAbsoluteIndex: ValueWithLocation<number>; // object_lists/equipment.txt
    initialGrenadeCountSetting: ValueWithLocation<GrenadeCountSetting>;
}>;

export type LoadoutPaletteTraits = Partial<{
    loadouts: LoadoutTraits[];
}>;

export type GameEngineLoadoutTraits = Partial<{
    spartanLoadoutsEnabled: ValueWithLocation<boolean>;
    eliteLoadoutsEnabled: ValueWithLocation<boolean>;
    loadoutPalettes: LoadoutPaletteTraits[];
}>;

export type GameEngineBaseVariant = {
    metadata: ContentItemMetadata;
    builtIn: boolean;
    teamScoringMethod?: ValueWithLocation<TeamScoringMethod>;
    miscellaneousOptions: GameEngineMiscellaneousOptions;
    respawnOptions: GameEngineRespawnOptions;
    socialOptions: GameEngineSocialOptions;
    mapOverrideOptions: GameEngineMapOverrideOptions;
    teamOptions: GameEngineTeamOptions;
    loadoutTraits: GameEngineLoadoutTraits;
};