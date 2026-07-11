import { describe, expect, it } from "vitest";
import { ParserContext } from "../../../frontend/abstract-syntax-tree/context";
import { ActionParserRepository } from "../../../frontend/abstract-syntax-tree/elements/trigger/action";
import { SyntaxKind } from "../../../frontend/abstract-syntax-tree/kinds";
import { Diagnostics, BUILT_IN_LOCATION } from "../../../frontend/diagnostics";
import { SymbolBinder, VariableScope, VariableType } from "../../../frontend/symbol-table";
import { Lexer } from "../../../frontend/tokens";
import { MEGALO_VERSIONS } from "../../../version";

const parseActionParameters = (source: string, actionName: string) => {
    const diagnostics = new Diagnostics();
    const version = MEGALO_VERSIONS["107-mcc"];
    const tokens = new Lexer(version).lex(source, diagnostics);
    const symbolBinder = new SymbolBinder(version, diagnostics);
    const ctx = new ParserContext(tokens, version, diagnostics, symbolBinder);

    ctx.symbolParser.addVariableToScope({
        name: "current_player",
        type: VariableType.Player,
        declaration: BUILT_IN_LOCATION,
        scope: VariableScope.Global,
    });
    ctx.symbolParser.addVariableToScope({
        name: "the_hill",
        type: VariableType.Object,
        declaration: BUILT_IN_LOCATION,
        scope: VariableScope.Global,
    });
    ctx.symbolParser.addVariableToScope({
        name: "created_object",
        type: VariableType.Object,
        declaration: BUILT_IN_LOCATION,
        scope: VariableScope.Global,
    });
    ctx.symbolParser.addVariableToScope({
        name: "spawn_point",
        type: VariableType.Object,
        declaration: BUILT_IN_LOCATION,
        scope: VariableScope.Global,
    });
    ctx.symbolParser.addConstantToScope({
        name: "true",
        declaration: BUILT_IN_LOCATION,
    });
    ctx.symbolParser.addStringToScope({
        name: "you_are_vip",
        language: "english",
        content: "You are the VIP",
        declaration: BUILT_IN_LOCATION,
    });

    const parser = ctx.actionParserRepository.getParser(actionName);
    expect(parser).toBeDefined();

    const anchor = tokens[0]!.location;
    const parameters = parser!(ctx, anchor);
    return { parameters, diagnostics };
};

describe("ActionParserRepository", () => {
    it("parses navpoint_set_priority with a keyword union", () => {
        const { parameters, diagnostics } = parseActionParameters("the_hill normal", "navpoint_set_priority");

        expect(diagnostics.hasErrors()).toBe(false);
        expect(parameters).toHaveLength(2);
        expect(parameters[1]).toMatchObject({ kind: SyntaxKind.KEYWORD, value: "normal" });
    });

    it("parses navpoint_set_visible with player visibility", () => {
        const { parameters, diagnostics } = parseActionParameters(
            "the_hill player current_player true",
            "navpoint_set_visible",
        );

        expect(diagnostics.hasErrors()).toBe(false);
        expect(parameters).toHaveLength(4);
        expect(parameters[1]).toMatchObject({ kind: SyntaxKind.KEYWORD, value: "player" });
    });

    it("parses create_object with optional parameters", () => {
        const { parameters, diagnostics } = parseActionParameters(
            "wall_device at spawn_point set created_object never_garbage",
            "create_object",
        );

        expect(diagnostics.hasErrors()).toBe(false);
        expect(parameters.some((p) => p.kind === SyntaxKind.KEYWORD && p.value === "set")).toBe(true);
        expect(parameters.some((p) => p.kind === SyntaxKind.KEYWORD && p.value === "never_garbage")).toBe(true);
    });

    it("parses play_sound with optional immediate flag", () => {
        const { parameters, diagnostics } = parseActionParameters(
            "player current_player immediate you_are_vip",
            "play_sound",
        );

        expect(diagnostics.hasErrors()).toBe(false);
        expect(parameters.some((p) => p.kind === SyntaxKind.KEYWORD && p.value === "immediate")).toBe(true);
    });

    it("parses play_sound player target when the sound string is unresolved", () => {
        const { parameters, diagnostics } = parseActionParameters(
            "player current_player vip",
            "play_sound",
        );

        expect(diagnostics.hasErrors()).toBe(false);
        expect(parameters).toHaveLength(3);
        expect(parameters[0]).toMatchObject({ kind: SyntaxKind.KEYWORD, value: "player" });
        expect(parameters[1]).toMatchObject({ kind: SyntaxKind.REFERENCE, identifier: "current_player" });
        expect(parameters[2]).toMatchObject({ kind: SyntaxKind.KEYWORD, value: "vip" });
    });

    it("parses set_loadout_palette with a loadout palette reference", () => {
        const diagnostics = new Diagnostics();
        const version = MEGALO_VERSIONS["107-mcc"];
        const tokens = new Lexer(version).lex("player current_player slayer_loadouts_t1", diagnostics);
        const symbolBinder = new SymbolBinder(version, diagnostics);
        const ctx = new ParserContext(tokens, version, diagnostics, symbolBinder);

        ctx.symbolParser.addVariableToScope({
            name: "current_player",
            type: VariableType.Player,
            declaration: BUILT_IN_LOCATION,
            scope: VariableScope.Global,
        });
        ctx.symbolParser.addLoadoutPaletteToScope("slayer_loadouts_t1", BUILT_IN_LOCATION);

        const parser = ctx.actionParserRepository.getParser("set_loadout_palette");
        const parameters = parser!(ctx, tokens[0]!.location);

        expect(diagnostics.hasErrors()).toBe(false);
        expect(parameters[2]).toMatchObject({
            kind: SyntaxKind.REFERENCE,
            identifier: "slayer_loadouts_t1",
        });
    });

    it("parses player_set_requisition_palette with a requisition palette reference", () => {
        const diagnostics = new Diagnostics();
        const version = MEGALO_VERSIONS["107-mcc"];
        const tokens = new Lexer(version).lex("current_player covy_palette_gold", diagnostics);
        const symbolBinder = new SymbolBinder(version, diagnostics);
        const ctx = new ParserContext(tokens, version, diagnostics, symbolBinder);

        ctx.symbolParser.addVariableToScope({
            name: "current_player",
            type: VariableType.Player,
            declaration: BUILT_IN_LOCATION,
            scope: VariableScope.Global,
        });
        ctx.symbolParser.addRequisitionPaletteToScope("covy_palette_gold", BUILT_IN_LOCATION);

        const parser = ctx.actionParserRepository.getParser("player_set_requisition_palette");
        const parameters = parser!(ctx, tokens[0]!.location);

        expect(diagnostics.hasErrors()).toBe(false);
        expect(parameters[1]).toMatchObject({
            kind: SyntaxKind.REFERENCE,
            identifier: "covy_palette_gold",
        });
    });

    it("parses math operations as symbolic operators in actions", () => {
        const { parameters, diagnostics } = parseActionParameters("the_hill -= 10", "object_adjust_maximum_health");

        expect(diagnostics.hasErrors()).toBe(false);
        expect(parameters[1]).toMatchObject({ kind: SyntaxKind.KEYWORD, value: "-=" });
    });

    it("parses player_set_objective with a dynamic string literal and number replacement", () => {
        const diagnostics = new Diagnostics();
        const version = MEGALO_VERSIONS["107-mcc"];
        const tokens = new Lexer(version).lex(
            "current_player \"+%n\" score_to_win_round",
            diagnostics,
        );
        const symbolBinder = new SymbolBinder(version, diagnostics);
        const ctx = new ParserContext(tokens, version, diagnostics, symbolBinder);

        ctx.symbolParser.addVariableToScope({
            name: "current_player",
            type: VariableType.Player,
            declaration: BUILT_IN_LOCATION,
            scope: VariableScope.Global,
        });
        ctx.symbolParser.addGameOptionToScope({
            name: "score_to_win_round",
            type: VariableType.Number,
            declaration: BUILT_IN_LOCATION,
        });

        const parser = ctx.actionParserRepository.getParser("player_set_objective");
        const parameters = parser!(ctx, tokens[0]!.location);

        expect(diagnostics.hasErrors()).toBe(false);
        expect(parameters).toHaveLength(2);
        expect(parameters[1]).toMatchObject({
            kind: SyntaxKind.DYNAMIC_STRING,
            string: { kind: SyntaxKind.QUOTED_STRING, value: "+%n" },
            replacements: [
                expect.objectContaining({
                    kind: SyntaxKind.REFERENCE,
                    identifier: "score_to_win_round",
                }),
            ],
        });
        expect(ctx.hasMore()).toBe(false);
    });

    it("parses player_set_objective_allegiance with replacements before the icon index", () => {
        const diagnostics = new Diagnostics();
        const version = MEGALO_VERSIONS["107-mcc"];
        const tokens = new Lexer(version).lex(
            "current_player \"+%n\" score_to_win_round 3",
            diagnostics,
        );
        const symbolBinder = new SymbolBinder(version, diagnostics);
        const ctx = new ParserContext(tokens, version, diagnostics, symbolBinder);

        ctx.symbolParser.addVariableToScope({
            name: "current_player",
            type: VariableType.Player,
            declaration: BUILT_IN_LOCATION,
            scope: VariableScope.Global,
        });
        ctx.symbolParser.addGameOptionToScope({
            name: "score_to_win_round",
            type: VariableType.Number,
            declaration: BUILT_IN_LOCATION,
        });

        const parser = ctx.actionParserRepository.getParser("player_set_objective_allegiance");
        const parameters = parser!(ctx, tokens[0]!.location);

        expect(diagnostics.hasErrors()).toBe(false);
        expect(parameters).toHaveLength(3);
        expect(parameters[1]).toMatchObject({
            kind: SyntaxKind.DYNAMIC_STRING,
            replacements: [
                expect.objectContaining({ identifier: "score_to_win_round" }),
            ],
        });
        expect(parameters[2]).toMatchObject({ kind: SyntaxKind.INTEGER, value: 3 });
    });

    it("registers empty actions", () => {
        const repository = new ActionParserRepository(MEGALO_VERSIONS["107-mcc"]);
        const parser = repository.getParser("begin");
        expect(parser).toBeDefined();

        const diagnostics = new Diagnostics();
        const version = MEGALO_VERSIONS["107-mcc"];
        const tokens = new Lexer(version).lex("unused", diagnostics);
        const ctx = new ParserContext(tokens, version, diagnostics, new SymbolBinder(version, diagnostics));
        expect(parser!(ctx, BUILT_IN_LOCATION)).toEqual([]);
    });
});
