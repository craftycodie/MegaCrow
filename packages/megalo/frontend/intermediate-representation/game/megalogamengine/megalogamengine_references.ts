import { ExplicitObject } from "./megalogamengine_explicit_object";
import { ExplicitPlayer } from "./megalogamengine_explicit_player";
import { ExplicitTeam } from "./megalogamengine_explicit_team";

export enum CustomVariableType {
    Constant = 0,
    PlayerNumber = 1,
    ObjectNumber = 2,
    TeamNumber = 3,
    GlobalNumber = 4,
    Option = 5,
    SpawnObject = 6,
    TeamScore = 7,
    PlayerScore = 8,
    PlayerMoney = 9,
    PlayerRating = 10,
    PlayerStat = 11,
    TeamStat = 12,
    RoundIndex = 13,
    SymmetricGametype = 14,
    SymmetricGametypePregame = 15,
    ScoreToWinRound = 16,
    FireTeamsEnabled = 17,
    TeamsEnabled = 18,
    RoundTimeLimit = 19,
    RoundCount = 20,
    PerfectionEnabled = 21,
    EarlyVictoryWinCount = 22,
    SuddenDeathTimeLimit = 23,
    GracePeriodTimeLimit = 24,
    LivesPerRound = 25,
    TeamLivesPerRound = 26,
    RespawnTime = 27,
    SuicideRespawnPenalty = 28,
    BetrayalRespawnPenalty = 29,
    RespawnTimeGrowth = 30,
    LoadoutSelectionTime = 31,
    RespawnTraitsDuration = 32,
    friendly_fire_enabled = 33,
    BetrayalBootingEnabled = 34,
    EnemyVoiceEnabled = 35,
    OpenChannelVoiceEnabled = 36,
    DeadPlayerVoiceEnabled = 37,
    GrenadesOnMap = 38,
    IndestructibleVehicles = 39,
    RedPowerupDuration = 40,
    BluePowerupDuration = 41,
    YellowPowerupDuration = 42,
    ObjectDeathDamageType = 43,
}

type ConstantCustomVariableReference = {
    type: CustomVariableType.Constant;
    immediateValue: number;
}

type PlayerNumberCustomVariableReference = {
    type: CustomVariableType.PlayerNumber;
    player: ExplicitPlayer;
    variableIndex: number;
}

type ObjectNumberCustomVariableReference = {
    type: CustomVariableType.ObjectNumber;
    object: ExplicitObject;
    variableIndex: number;
}

type TeamNumberCustomVariableReference = {
    type: CustomVariableType.TeamNumber;
    team: ExplicitTeam;
    variableIndex: number;
}

type GlobalNumberCustomVariableReference = {
    type: CustomVariableType.GlobalNumber;
    variableIndex: number;
}

type OptionCustomVariableReference = {
    type: CustomVariableType.Option;
    optionIndex: number;
}

type SpawnObjectCustomVariableReference = {
    type: CustomVariableType.SpawnObject;
    object: ExplicitObject;
}

type TeamScoreCustomVariableReference = {
    type: CustomVariableType.TeamScore;
    team: ExplicitTeam;
}

type PlayerScoreCustomVariableReference = {
    type: CustomVariableType.PlayerScore;
    player: ExplicitPlayer;
}

type PlayerMoneyCustomVariableReference = {
    type: CustomVariableType.PlayerMoney;
    player: ExplicitPlayer;
}

type PlayerRatingCustomVariableReference = {
    type: CustomVariableType.PlayerRating;
    player: ExplicitPlayer;
}

type PlayerStatCustomVariableReference = {
    type: CustomVariableType.PlayerStat;
    player: ExplicitPlayer;
    statisticIndex: number;
}

type TeamStatCustomVariableReference = {
    type: CustomVariableType.TeamStat;
    team: ExplicitTeam;
    statisticIndex: number;
}


export type CustomVariableReference = 
    | ConstantCustomVariableReference
    | PlayerNumberCustomVariableReference
    | ObjectNumberCustomVariableReference
    | TeamNumberCustomVariableReference
    | GlobalNumberCustomVariableReference
    | OptionCustomVariableReference
    | SpawnObjectCustomVariableReference
    | TeamScoreCustomVariableReference
    | PlayerScoreCustomVariableReference
    | PlayerMoneyCustomVariableReference
    | PlayerRatingCustomVariableReference
    | PlayerStatCustomVariableReference
    | TeamStatCustomVariableReference;


export enum PlayerReferenceType {
    GlobalPlayer = 0,
    PlayerPlayer = 1,
    ObjectPlayer = 2,
    TeamPlayer = 3,
}

type GlobalPlayerReference = {
    type: PlayerReferenceType.GlobalPlayer;
    player: ExplicitPlayer;
}

type PlayerPlayerReference = {
    type: PlayerReferenceType.PlayerPlayer;
    player: ExplicitPlayer;
    variableIndex: number;
}

type ObjectPlayerReference = {
    type: PlayerReferenceType.ObjectPlayer;
    object: ExplicitObject;
    variableIndex: number;
}

type TeamPlayerReference = {
    type: PlayerReferenceType.TeamPlayer;
    team: ExplicitTeam;
    variableIndex: number;
}

export type PlayerReference = 
    | GlobalPlayerReference
    | PlayerPlayerReference 
    | ObjectPlayerReference 
    | TeamPlayerReference;

export enum ObjectReferenceType {
    GlobalObject = 0,
    PlayerObject = 1,
    ObjectObject = 2,
    TeamObject = 3,
    PlayerBiped = 4,
    PlayerPlayerBiped = 5,
    ObjectPlayerBiped = 6,
    TeamPlayerBiped = 7,
}

type GlobalObjectReference = {
    type: ObjectReferenceType.GlobalObject;
    object: ExplicitObject;
}

type PlayerObjectReference = {
    type: ObjectReferenceType.PlayerObject;
    player: ExplicitPlayer;
    variableIndex: number;
}

type ObjectObjectReference = {
    type: ObjectReferenceType.ObjectObject;
    object: ExplicitObject;
    variableIndex: number;
}

type TeamObjectReference = {
    type: ObjectReferenceType.TeamObject;
    team: ExplicitTeam;
    variableIndex: number;
}

type PlayerBipedReference = {
    type: ObjectReferenceType.PlayerBiped;
    player: ExplicitPlayer;
}

type PlayerPlayerBipedReference = {
    type: ObjectReferenceType.PlayerPlayerBiped;
    player: ExplicitPlayer;
    variableIndex: number;
}

type ObjectPlayerBipedReference = {
    type: ObjectReferenceType.ObjectPlayerBiped;
    object: ExplicitObject;
    variableIndex: number;
}

type TeamPlayerBipedReference = {
    type: ObjectReferenceType.TeamPlayerBiped;
    team: ExplicitTeam;
    variableIndex: number;
}

export type ObjectReference = 
    | GlobalObjectReference
    | PlayerObjectReference
    | ObjectObjectReference
    | TeamObjectReference
    | PlayerBipedReference
    | PlayerPlayerBipedReference
    | ObjectPlayerBipedReference
    | TeamPlayerBipedReference;

export enum TeamReferenceType {
    GlobalTeam = 0,
    PlayerTeam = 1,
    ObjectTeam = 2,
    TeamTeam = 3,
    PlayerOwnerTeam = 4,
    ObjectOwnerTeam = 5,
}

type GlobalTeamReference = {
    type: TeamReferenceType.GlobalTeam;
    team: ExplicitTeam;
}

type PlayerTeamReference = {
    type: TeamReferenceType.PlayerTeam;
    player: ExplicitPlayer;
    variableIndex: number;
}

type ObjectTeamReference = {
    type: TeamReferenceType.ObjectTeam;
    object: ExplicitObject;
    variableIndex: number;
}

type TeamTeamReference = {
    type: TeamReferenceType.TeamTeam;
    team: ExplicitTeam;
}

type PlayerOwnerTeamReference = {
    type: TeamReferenceType.PlayerOwnerTeam;
    player: ExplicitPlayer;
    variableIndex: number;
}

type ObjectOwnerTeamReference = {
    type: TeamReferenceType.ObjectOwnerTeam;
    object: ExplicitObject;
    variableIndex: number;
}

export type TeamReference = 
    | GlobalTeamReference
    | PlayerTeamReference
    | ObjectTeamReference
    | TeamTeamReference
    | PlayerOwnerTeamReference
    | ObjectOwnerTeamReference;

export enum CustomTimerType {
    Global = 0,
    Player = 1,
    Team = 2,
    Object = 3,
    Round = 4,
    SuddenDeath = 5,
    GracePeriod = 6,
}

type GlobalCustomTimerReference = {
    type: CustomTimerType.Global;
    variableIndex: number;
}

type PlayerCustomTimerReference = {
    type: CustomTimerType.Player;
    player: ExplicitPlayer;
    variableIndex: number;
}

type TeamCustomTimerReference = {
    type: CustomTimerType.Team;
    team: ExplicitTeam;
    variableIndex: number;
}

type ObjectCustomTimerReference = {
    type: CustomTimerType.Object;
    object: ExplicitObject;
    variableIndex: number;
}

type RoundCustomTimerReference = {
    type: CustomTimerType.Round;
    variableIndex: number;
}

type SuddenDeathCustomTimerReference = {
    type: CustomTimerType.SuddenDeath;
    variableIndex: number;
}

type GracePeriodCustomTimerReference = {
    type: CustomTimerType.GracePeriod;
    variableIndex: number;
}

export type CustomTimerReference = 
    | GlobalCustomTimerReference
    | PlayerCustomTimerReference
    | TeamCustomTimerReference
    | ObjectCustomTimerReference
    | RoundCustomTimerReference
    | SuddenDeathCustomTimerReference
    | GracePeriodCustomTimerReference;


export type ObjectTypeReference = number;