import { ValueWithLocation } from "../..";

export enum TriggerExecutionMode {
    General = 0,
    Player = 1,
    RandomPlayer = 2,
    Team = 3,
    Object = 4,
    ObjectWithLabel = 5,
}

export enum TriggerType {
    Normal = 0,
    Subroutine = 1,
    Initialization = 2,
    LocalInitialization = 3,
    HostMigration = 4,
    ObjectDeath = 5,
    Local = 6,
    Pregame = 7,
}

export type Trigger = {
    executionMode: ValueWithLocation<TriggerExecutionMode>;
    triggerType: ValueWithLocation<TriggerType>;
    objectFilterIndex?: ValueWithLocation<number>;
    firstCondition: number;
    conditionCount: number;
    firstAction: number;
    actionCount: number;
}
