import { ASTNode, SyntaxKind } from "..";
import { MegaloVersion } from "../../../version";
import { SourceCodeLocation } from "../../diagnostics";
import { Token } from "../../tokens";
import { ParserContext } from "../context";

import { ConstantsElementNode, constantsParser } from "./constants";
import { GameOptionsElementNode, gameOptionsParser } from "./game_options";
export { GameOptionEntryKind, OverrideValueKind } from "./game_options";
import { HudWidgetsElementNode, hudWidgetsParser } from "./hud_widgets";
import { LoadoutElementNode, loadoutParser } from "./loadout";
import { LoadoutPaletteElementNode, loadoutPaletteParser } from "./loadout_palette";
import { TeamsElementNode, teamsParser } from "./teams";
import { EngineDataElementNode, engineDataParser } from "./engine_data";
import { PlayerRatingElementNode, playerRatingParser } from "./player_rating";
import { MapPermissionsElementNode, mapPermissionsParser } from "./map_permissions";
import { GameStatsElementNode, gameStatsParser } from "./game_stats";
import { MapObjectElementNode, mapObjectParser } from "./map_object";
import { RequisitionPaletteElementNode, requisitionPaletteParser } from "./requisition_palette";
import { BaseElementNode, baseParser } from "./base";
import { IncludeElementNode, includeParser } from "./include";
import { LocalizedIncludeElementNode, localizedIncludeParser } from "./localized_include";
import { StringTableElementNode, stringTableParser } from "./string_table";
import { VariablesElementNode, variablesParser } from "./variables";
import { TriggerElementNode, triggerParser } from "./trigger";

// REGISTERING NEW ELEMENTS:
// - Add an ElementKind enum value.
// - Create a new parser function and add it to registerParsers.
// - Add the return type of the parser to the ASTElementNode discriminated union.
// (we will probably very rarely do this lol)

export const enum ElementKind {
    BASE,
    INCLUDE,
    LOCALIZED_INCLUDE,
    STRING_TABLE,
    CONSTANTS,
    VARIABLES,
    GAME_OPTIONS,
    HUD_WIDGETS,
    LOADOUT,
    LOADOUT_PALETTE,
    TEAMS,
    ENGINE_DATA,
    PLAYER_RATING,
    MAP_PERMISSIONS,
    GAME_STATS,
    MAP_OBJECT,
    REQUISITION_PALETTE,
    TRIGGER,
}

// used by elements
export type ASTElementBase<K extends ElementKind> = ASTNode<SyntaxKind.ELEMENT> & {
    elementKind: K;
    /** Keyword token only — preferred for many diagnostics. */
    keywordLocation: SourceCodeLocation;
};
// only used here to enforce ASTElementNode discrim union members implement ASTElementBase
type ASTElementNodeWithBase<T extends ASTElementBase<any>> = T;

export type ASTElementNode = ASTElementNodeWithBase<
      BaseElementNode
    | IncludeElementNode
    | LocalizedIncludeElementNode
    | StringTableElementNode
    | ConstantsElementNode
    | VariablesElementNode
    | GameOptionsElementNode
    | HudWidgetsElementNode
    | LoadoutElementNode
    | LoadoutPaletteElementNode
    | TeamsElementNode
    | EngineDataElementNode
    | PlayerRatingElementNode
    | MapPermissionsElementNode
    | GameStatsElementNode
    | MapObjectElementNode
    | RequisitionPaletteElementNode
    | TriggerElementNode
>

export type ElementParser<E extends ASTElementNode> = (ctx: ParserContext, elementToken: Token) => E;

// ElementParserRepository is Workspace lifecycle - it is instanced per workspace.
export class ElementParserRepository {
    // We could proooobably get away with using a static object here,
    // but building up based on the megalo version allows us to configure
    // alternate parsers for different megalo versions if necessary.
    private readonly parsers = new Map<string, ElementParser<ASTElementNode>>();

    private registerParser(name: string, parser: ElementParser<ASTElementNode>) {
        this.parsers.set(name, parser);
    }

    private registerParsers(megaloVersion: MegaloVersion) {
        this.registerParser("base", baseParser);
        this.registerParser("include", includeParser);
        this.registerParser("localized_include", localizedIncludeParser);
        this.registerParser("string_table", stringTableParser);
        this.registerParser("constants", constantsParser);
        this.registerParser("variables", variablesParser);
        this.registerParser("game_options", gameOptionsParser);
        this.registerParser("hud_widgets", hudWidgetsParser);
        this.registerParser("loadout", loadoutParser);
        this.registerParser("loadout_palette", loadoutPaletteParser);
        this.registerParser("teams", teamsParser);
        this.registerParser("engine_data", engineDataParser);
        this.registerParser("player_rating", playerRatingParser);
        this.registerParser("map_permissions", mapPermissionsParser);
        this.registerParser("game_stats", gameStatsParser);
        this.registerParser("map_object", mapObjectParser);
        this.registerParser("requisition_palette", requisitionPaletteParser);
        this.registerParser("trigger", triggerParser);
    }

    public constructor(megaloVersion: MegaloVersion) {
        this.registerParsers(megaloVersion);
    }

    public getParser(name: string): ElementParser<ASTElementNode> | undefined {
        return this.parsers.get(name);
    }
}