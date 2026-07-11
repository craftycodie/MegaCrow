import { MultiplayerTeamDesignator } from "../game_engine_default";
import { CustomVariableReference } from "./megalogamengine_references";

export enum MegaloVariableNetworkState {
    Local = 0,
    Networked = 1,
    NetworkedHigh = 2,
}

export type VariableMetadata = {
    numericVariables: {
        variable: CustomVariableReference;
        networkState: MegaloVariableNetworkState;
    }[];
    timerVariables: CustomVariableReference[];
    teamVariables: {
        value: MultiplayerTeamDesignator;
        networkState: MegaloVariableNetworkState;
    }[];
    playerVariables: MegaloVariableNetworkState[];
    objectVariables: MegaloVariableNetworkState[];
};
