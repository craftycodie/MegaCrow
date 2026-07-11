import { StringTableReference } from "../string_table";
import { CustomTimerReference, CustomVariableReference, ObjectReference, PlayerReference, TeamReference } from "./megalogamengine_references";

export enum ReplaceableTokenType {
    Player,
    Team,
    Object,
    CustomVariable,
    CustomTimer,
}

type PlayerReplaceableToken = {
    type: ReplaceableTokenType.Player;
    player: PlayerReference;
}

type TeamReplaceableToken = {
    type: ReplaceableTokenType.Team;
    team: TeamReference;
}

type ObjectReplaceableToken = {
    type: ReplaceableTokenType.Object;
    object: ObjectReference;
}

type CustomVariableReplaceableToken = {
    type: ReplaceableTokenType.CustomVariable;
    customVariable: CustomVariableReference;
}

type CustomTimerReplaceableToken = {
    type: ReplaceableTokenType.CustomTimer;
    customTimer: CustomTimerReference;   
}

export type ReplaceableToken = 
    | PlayerReplaceableToken 
    | TeamReplaceableToken 
    | ObjectReplaceableToken 
    | CustomVariableReplaceableToken 
    | CustomTimerReplaceableToken;

export type DynamicString = {
    stringIndex: StringTableReference;
    tokens: ReplaceableToken[];
}