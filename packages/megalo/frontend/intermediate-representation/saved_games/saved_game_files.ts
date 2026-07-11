export type ContentItemHistory = {
    timestamp: Date;
    xuid: bigint;
    name: string;
    isOnline: boolean;
};

export type ContentItemGeneralMetadata = {
    fileType: number;
    sizeInBytes: number;
    uniqueId: bigint;
    parentUniqueId: bigint;
    rootUniqueId: bigint;
    gameMode: number;
    gameEngineType: number;
};

export type ContentItemMetadata = {
    general: ContentItemGeneralMetadata;
    creationHistory: ContentItemHistory;
    modificationHistory: ContentItemHistory;
    name: string;
    description: string;
};