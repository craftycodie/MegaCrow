import { StringTableReference } from "../string_table";

export enum GameStatisticFormat {
    Number = 0,
    NumberWithSign = 1,
    Percentage = 2,
    Time = 3,
}

export enum GameStatisticSortOrder {
    None = -1,
    Ascending = 0,
    Descending = 1,
}

export enum GameStatisticGrouping {
    Player = 0,
    Team = 1,
}

export type MegaloGameStatistic = {
    nameStringIndex: StringTableReference;
    format: GameStatisticFormat;
    sortOrder: GameStatisticSortOrder;
    grouping: GameStatisticGrouping;
}