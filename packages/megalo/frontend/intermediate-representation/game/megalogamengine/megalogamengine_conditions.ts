import { CustomTimerReference, ObjectReference, ObjectTypeReference, PlayerReference, TeamReference } from "./megalogamengine_references";
import { VariantVariable } from "./megalogamengine_variant_variable";

export enum NumericComparison {
    LessThan = 0,
    GreaterThan = 1,
    EqualTo = 2,
    LessThanOrEqualTo = 3,
    GreaterThanOrEqualTo = 4,
    NotEqualTo = 5,
}

export enum ConditionType {
    None = 0,
    If = 1,
    ObjectInArea = 2,
    PlayerDied = 3,
    TeamDisposition = 4,
    TimerExpired = 5,
    ObjectIsType = 6,
    TeamIsActive = 7,
    ObjectOutOfBounds = 8,
    PlayerIsFireTeamLeader = 9,
    PlayerAssistedWithKill = 10,
    ObjectMatchesFilter = 11,
    PlayerIsActive = 12,
    EquipmentIsActive = 13,
    PlayerIsSpartan = 14,
    PlayerIsElite = 15,
    PlayerIsEditor = 16,
    GameIsForge = 17,
}

export type ConditionIfParameters = {
    left: VariantVariable;
    right: VariantVariable;
    comparison: NumericComparison;
}

export type ConditionObjectInAreaParameters = {
    object: ObjectReference;
    area: ObjectReference;
}

/** Bit indices for `e_player_death_killer_type`. */
export enum PlayerDeathKillerType {
    Environment = 0,
    Suicide = 1,
    Enemy = 2,
    Betrayal = 3,
    QuitGame = 4,
}

export type PlayerDeathKillerTypeFlags = {
    environment: boolean;
    suicide: boolean;
    enemy: boolean;
    betrayal: boolean;
    quit_game: boolean;
};

export type ConditionPlayerDiedParameters = {
    player: PlayerReference;
    killerType: PlayerDeathKillerTypeFlags;
}

export enum Disposition {
    Neutral = 0,
    Friendly = 1,
    Enemy = 2,
}

export type ConditionTeamDispositionParameters = {
    team1: TeamReference;
    team2: TeamReference;
    disposition: Disposition;
}

export type ConditionTimerExpiredParameters = {
    timer: CustomTimerReference;
}

export type ConditionObjectIsTypeParameters = {
    object: ObjectReference;
    objectType: ObjectTypeReference;
}

export type ConditionTeamIsActiveParameters = {
    team: TeamReference;
}

export type ConditionObjectOutOfBoundsParameters = {
    object: ObjectReference;
}

export type ConditionPlayerIsFireTeamLeaderParameters = {
    player: PlayerReference;
}

export type ConditionPlayerAssistedWithKillParameters = {
    player1: PlayerReference;
    player2: PlayerReference;
}

export type ConditionObjectMatchesFilterParameters = {
    object: ObjectReference;
    filterIndex: number;
}

export type ConditionPlayerIsActiveParameters = {
    player: PlayerReference;
}

export type ConditionEquipmentIsActiveParameters = {
    object: ObjectReference;
}

export type ConditionPlayerIsSpartanParameters = {
    player: PlayerReference;
}

export type ConditionPlayerIsEliteParameters = {
    player: PlayerReference;
}

export type ConditionPlayerIsEditorParameters = {
    player: PlayerReference;
}

export type ConditionGameIsForgeParameters = never;

type ConditionBase = {
    negated: boolean;
    unionGroup: number;
    executeBeforeAction: number;
}

type ConditionParameters<T extends ConditionType, P> = {
    type: T;
    parameters: P;
}

export type Condition = ConditionBase & (
    | ConditionParameters<ConditionType.If, ConditionIfParameters>
    | ConditionParameters<ConditionType.ObjectInArea, ConditionObjectInAreaParameters>
    | ConditionParameters<ConditionType.PlayerDied, ConditionPlayerDiedParameters>
    | ConditionParameters<ConditionType.TeamDisposition, ConditionTeamDispositionParameters>
    | ConditionParameters<ConditionType.TimerExpired, ConditionTimerExpiredParameters>
    | ConditionParameters<ConditionType.ObjectIsType, ConditionObjectIsTypeParameters>
    | ConditionParameters<ConditionType.TeamIsActive, ConditionTeamIsActiveParameters>
    | ConditionParameters<ConditionType.ObjectOutOfBounds, ConditionObjectOutOfBoundsParameters>
    | ConditionParameters<ConditionType.PlayerIsFireTeamLeader, ConditionPlayerIsFireTeamLeaderParameters>
    | ConditionParameters<ConditionType.PlayerAssistedWithKill, ConditionPlayerAssistedWithKillParameters>
    | ConditionParameters<ConditionType.ObjectMatchesFilter, ConditionObjectMatchesFilterParameters>
    | ConditionParameters<ConditionType.PlayerIsActive, ConditionPlayerIsActiveParameters>
    | ConditionParameters<ConditionType.EquipmentIsActive, ConditionEquipmentIsActiveParameters>
    | ConditionParameters<ConditionType.PlayerIsSpartan, ConditionPlayerIsSpartanParameters>
    | ConditionParameters<ConditionType.PlayerIsElite, ConditionPlayerIsEliteParameters>
    | ConditionParameters<ConditionType.PlayerIsEditor, ConditionPlayerIsEditorParameters>
    | ConditionParameters<ConditionType.GameIsForge, ConditionGameIsForgeParameters>
);
