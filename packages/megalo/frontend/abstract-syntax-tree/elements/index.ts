import { ASTNode, SyntaxKind } from "..";
import { MegaloVersion } from "../../../version";
import { Token } from "../../tokens";
import { ParserContext } from "../context";

import { ConstantsElementNode, constantsParser } from "./constants";
import { GameOptionsElementNode, gameOptionsParser } from "./game_options";
export { GameOptionEntryKind } from "./game_options";
import { HudWidgetsElementNode, hudWidgetsParser } from "./hud_widgets";
import { LoadoutElementNode, loadoutParser } from "./loadout";
import { LoadoutPaletteElementNode, loadoutPaletteParser } from "./loadout_palette";
import { TeamsElementNode, teamsParser } from "./teams";
import { BaseElementNode, baseParser } from "./base";
import { IncludeElementNode, includeParser } from "./include";
import { LocalizedIncludeElementNode, localizedIncludeParser } from "./localized_include";
import { StringTableElementNode, stringTableParser } from "./string_table";
import { VariablesElementNode, variablesParser } from "./variables";

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
}

// used by elements
export type ASTElementBase<K extends ElementKind> = ASTNode<SyntaxKind.ELEMENT> & { elementKind: K };
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
    }

    public constructor(megaloVersion: MegaloVersion) {
        this.registerParsers(megaloVersion);
    }

    public getParser(name: string): ElementParser<ASTElementNode> | undefined {
        return this.parsers.get(name);
    }
}