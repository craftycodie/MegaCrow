import type { MegaloVersion } from "../../../version";
import type { SourceCodeLocation } from "../../diagnostics";
import type { Token } from "../../tokens";
import type { ASTNode, SyntaxKind } from "..";
import type { ParserContext } from "../context";

import { type ConstantsElementNode, constantsParser } from "./constants";
import { type GameOptionsElementNode, gameOptionsParser } from "./game_options";

export { GameOptionEntryKind, OverrideValueKind } from "./game_options";

import { type BaseElementNode, baseParser } from "./base";
import { type EngineDataElementNode, engineDataParser } from "./engine_data";
import { type GameStatsElementNode, gameStatsParser } from "./game_stats";
import { type HudWidgetsElementNode, hudWidgetsParser } from "./hud_widgets";
import { type IncludeElementNode, includeParser } from "./include";
import { type LoadoutElementNode, loadoutParser } from "./loadout";
import {
  type LoadoutPaletteElementNode,
  loadoutPaletteParser,
} from "./loadout_palette";
import {
  type LocalizedIncludeElementNode,
  localizedIncludeParser,
} from "./localized_include";
import { type MapObjectElementNode, mapObjectParser } from "./map_object";
import {
  type MapPermissionsElementNode,
  mapPermissionsParser,
} from "./map_permissions";
import {
  type PlayerRatingElementNode,
  playerRatingParser,
} from "./player_rating";
import {
  type RequisitionPaletteElementNode,
  requisitionPaletteParser,
} from "./requisition_palette";
import { type StringTableElementNode, stringTableParser } from "./string_table";
import { type TeamsElementNode, teamsParser } from "./teams";
import { type TriggerElementNode, triggerParser } from "./trigger";
import { type VariablesElementNode, variablesParser } from "./variables";

// REGISTERING NEW ELEMENTS:
// - Add an ElementKind enum value.
// - Create a new parser function and add it to registerParsers.
// - Add the return type of the parser to the ASTElementNode discriminated union.
// (we will probably very rarely do this lol)

export enum ElementKind {
  BASE = 0,
  INCLUDE = 1,
  LOCALIZED_INCLUDE = 2,
  STRING_TABLE = 3,
  CONSTANTS = 4,
  VARIABLES = 5,
  GAME_OPTIONS = 6,
  HUD_WIDGETS = 7,
  LOADOUT = 8,
  LOADOUT_PALETTE = 9,
  TEAMS = 10,
  ENGINE_DATA = 11,
  PLAYER_RATING = 12,
  MAP_PERMISSIONS = 13,
  GAME_STATS = 14,
  MAP_OBJECT = 15,
  REQUISITION_PALETTE = 16,
  TRIGGER = 17,
}

// used by elements
export type ASTElementBase<K extends ElementKind> =
  ASTNode<SyntaxKind.ELEMENT> & {
    elementKind: K;
    /** Keyword token only — preferred for many diagnostics. */
    keywordLocation: SourceCodeLocation;
  };
// only used here to enforce ASTElementNode discrim union members implement ASTElementBase
type ASTElementNodeWithBase<T extends ASTElementBase<any>> = T;

export type ASTElementNode = ASTElementNodeWithBase<
  | BaseElementNode
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
>;

export type ElementParser<E extends ASTElementNode> = (
  ctx: ParserContext,
  elementToken: Token
) => E;

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
