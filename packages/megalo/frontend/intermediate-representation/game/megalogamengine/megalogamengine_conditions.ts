import { ValueWithLocation } from "../..";
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
    left: ValueWithLocation<VariantVariable>;
    right: ValueWithLocation<VariantVariable>;
    comparison: ValueWithLocation<NumericComparison>;
}

export type ConditionObjectInAreaParameters = {
    object: ValueWithLocation<ObjectReference>;
    area: ValueWithLocation<ObjectReference>;
}

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
    player: ValueWithLocation<PlayerReference>;
    killerType: ValueWithLocation<PlayerDeathKillerTypeFlags>;
}

export enum Disposition {
    Neutral = 0,
    Friendly = 1,
    Enemy = 2,
}

export type ConditionTeamDispositionParameters = {
    team1: ValueWithLocation<TeamReference>;
    team2: ValueWithLocation<TeamReference>;
    disposition: ValueWithLocation<Disposition>;
}

export type ConditionTimerExpiredParameters = {
    timer: ValueWithLocation<CustomTimerReference>;
}

export type ConditionObjectIsTypeParameters = {
    object: ValueWithLocation<ObjectReference>;
    objectType: ValueWithLocation<ObjectTypeReference>;
}

export type ConditionTeamIsActiveParameters = {
    team: ValueWithLocation<TeamReference>;
}

export type ConditionObjectOutOfBoundsParameters = {
    object: ValueWithLocation<ObjectReference>;
}

export type ConditionPlayerIsFireTeamLeaderParameters = {
    player: ValueWithLocation<PlayerReference>;
}

export type ConditionPlayerAssistedWithKillParameters = {
    player1: ValueWithLocation<PlayerReference>;
    player2: ValueWithLocation<PlayerReference>;
}

export type ConditionObjectMatchesFilterParameters = {
    object: ValueWithLocation<ObjectReference>;
    filterIndex: ValueWithLocation<number>;
}

export type ConditionPlayerIsActiveParameters = {
    player: ValueWithLocation<PlayerReference>;
}

export type ConditionEquipmentIsActiveParameters = {
    object: ValueWithLocation<ObjectReference>;
}

export type ConditionPlayerIsSpartanParameters = {
    player: ValueWithLocation<PlayerReference>;
}

export type ConditionPlayerIsEliteParameters = {
    player: ValueWithLocation<PlayerReference>;
}

export type ConditionPlayerIsEditorParameters = {
    player: ValueWithLocation<PlayerReference>;
}

export type ConditionGameIsForgeParameters = never;

type ConditionBase = {
    negated: boolean;
    unionGroup: number;
    executeBeforeAction: number;
}

type ConditionParameters<T extends ConditionType, P> = {
    type: ValueWithLocation<T>;
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
