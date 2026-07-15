import { ValueWithLocation } from "..";

export type ContentItemHistory = {
    timestamp: Date;
    xuid: bigint;
    name: string;
    isOnline: boolean;
};

export type ContentItemGeneralMetadata = {
    gameMode: number;
    gameEngineType: number;
};

export type ContentItemMetadata = {
    general: ContentItemGeneralMetadata;
    creationHistory: ContentItemHistory;
    modificationHistory: ContentItemHistory;
    name?: ValueWithLocation<string>;
    description?: ValueWithLocation<string>;
};