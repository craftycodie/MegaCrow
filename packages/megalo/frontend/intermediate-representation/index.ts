import { MegaloVersion } from "../../version";
import { AST } from "../abstract-syntax-tree";
import { BUILT_IN_LOCATION, SourceLocation } from "../diagnostics";
import { ObjectLists } from "../object-lists";
import { GameEngineCustomVariant } from "./game/game_variant";
import { addStringTableEntry, StringTable } from "./game/string_table";
import { applyDefaultLoadoutCameraTime } from "./postprocessing/applyDefaultLoadoutCameraTime";

type LocationMeta = { location: SourceLocation };
export type ValueWithLocation<T> = 
    // Enforce that the provided T doesnt already have a location property.
    // Then enforce that a SourceLocation is provided.
    T extends object 
        ? "location" extends keyof T
            ? never
            : T & LocationMeta
        : T & LocationMeta;

export type IR = {
    baseFilePath?: string;
    gameVariant: GameEngineCustomVariant;
};

export type LowerContext = {
    objectLists?: ObjectLists;
};

export const valueWithLocation = <T>(
    value: T,
    location: SourceLocation,
): ValueWithLocation<T> => {
    if (value !== null && typeof value === "object") {
        return { ...value, location } as ValueWithLocation<T>;
    }
    // Box primitives so they can carry .location
    return Object.assign(Object(value), { location }) as ValueWithLocation<T>;
};

export class Lowerer {
    private readonly megaloVersion: MegaloVersion;
    public constructor(megaloVersion: MegaloVersion) {
        this.megaloVersion = megaloVersion;
    }

    public lower(ast: AST, context: LowerContext = {}): IR {
        void ast;
        void context;
        void this.megaloVersion;

        const ir = this.buildDefaultIR();

        this.postprocess(ir);

        return ir;
    }

    private postprocess(ir: IR) {
        applyDefaultLoadoutCameraTime(ir);
    }

    private buildDefaultIR(): IR {
        let scriptStringTable: StringTable = [];
        const defaultNameIndex = addStringTableEntry(scriptStringTable, {
            english: "Custom Game",
        })

        let ir: IR = {
            baseFilePath: undefined,
            gameVariant: {
                baseVariant: {
                    metadata: {
                        general: {
                            gameEngineType: 0,
                            gameMode: 0,
                        },
                        creationHistory: {
                            timestamp: new Date(),
                            xuid: BigInt(0),
                            name: "Default",
                            isOnline: false,
                        },
                        modificationHistory: {
                            timestamp: new Date(),
                            xuid: BigInt(0),
                            name: "Default",
                            isOnline: false,
                        },
                    },
                    builtIn: valueWithLocation(false, BUILT_IN_LOCATION),
                    miscellaneousOptions: {},
                    respawnOptions: {},
                    socialOptions: {},
                    mapOverrideOptions: {},
                    teamOptions: {},
                    loadoutTraits: {},
                },
                playerTraits: [],
                userDefinedOptions: [],
                scriptStrings: scriptStringTable,
                baseNameStringIndex: valueWithLocation(defaultNameIndex, BUILT_IN_LOCATION),
                localizedName: [],
                localizedDescription: [],
                localizedCategory: [],
                engineIcon: valueWithLocation(0, BUILT_IN_LOCATION),
                engineCategory: valueWithLocation(0, BUILT_IN_LOCATION),
                mapPermissions: undefined,
                playerRatings: undefined,
                scoreToWinRound: undefined,
                fireTeamsEnabled: undefined,
                symmetricGametype: undefined,
                baseVariantParametersLocked: {},
                baseVariantParametersHidden: {},
                gameEngine: {
                    conditions: [],
                    actions: [],
                    triggers: [],
                    statistics: [],
                    globalVariableMetadata: {
                        numericVariables: [],
                        timerVariables: [],
                        teamVariables: [],
                        playerVariables: [],
                        objectVariables: [],
                    },
                    playerVariableMetadata: {
                        numericVariables: [],
                        timerVariables: [],
                        teamVariables: [],
                        playerVariables: [],
                        objectVariables: [],
                    },
                    objectVariableMetadata: {
                        numericVariables: [],
                        timerVariables: [],
                        teamVariables: [],
                        playerVariables: [],
                        objectVariables: [],
                    },
                    teamVariableMetadata: {
                        numericVariables: [],
                        timerVariables: [],
                        teamVariables: [],
                        playerVariables: [],
                        objectVariables: [],
                    },
                    hudWidgets: [],
                    initializationTriggerIndex: 0,
                    localInitializationTriggerIndex: 0,
                    hostMigrationTriggerIndex: 0,
                    doubleMigrationTriggerIndex: 0,
                    objectDeathEventTriggerIndex: 0,
                    localTriggerIndex: 0,
                    pregameTriggerIndex: 0,
                    objectsUsed: [],
                    objectFilters: [],
                },
                tu1Settings: {}
            },
        };
        return ir;
    }
}
