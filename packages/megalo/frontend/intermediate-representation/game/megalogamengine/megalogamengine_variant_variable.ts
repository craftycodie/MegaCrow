import type {
  CustomTimerReference,
  CustomVariableReference,
  ObjectReference,
  PlayerReference,
  TeamReference,
} from "./megalogamengine_references";

export enum VariableType {
  CustomVariable = 0,
  Player = 1,
  Object = 2,
  Team = 3,
  CustomTimer = 4,
}

type PlayerVariable = {
  type: VariableType.Player;
  player: PlayerReference;
};

type ObjectVariable = {
  type: VariableType.Object;
  object: ObjectReference;
};

type TeamVariable = {
  type: VariableType.Team;
  team: TeamReference;
};

type CustomTimerVariable = {
  type: VariableType.CustomTimer;
  customTimer: CustomTimerReference;
};

type CustomVariableVariable = {
  type: VariableType.CustomVariable;
  customVariable: CustomVariableReference;
};

export type VariantVariable =
  | PlayerVariable
  | ObjectVariable
  | TeamVariable
  | CustomTimerVariable
  | CustomVariableVariable;
