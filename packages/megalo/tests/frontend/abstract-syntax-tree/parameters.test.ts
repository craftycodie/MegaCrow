import { describe, expect, it } from "vitest";
import { ParserContext } from "../../../frontend/abstract-syntax-tree/context";
import {
    KeywordParameter,
    OptionalParameter,
    ParameterType,
    parameterParserBuilder,
} from "../../../frontend/abstract-syntax-tree/parameters";
import { SyntaxKind } from "../../../frontend/abstract-syntax-tree/kinds";
import { Diagnostics, BUILT_IN_LOCATION } from "../../../frontend/diagnostics";
import { SymbolBinder, VariableScope, VariableType } from "../../../frontend/symbol-table";
import { Lexer } from "../../../frontend/tokens";
import { MEGALO_VERSIONS } from "../../../version";

const parseParameters = (source: string, parser: ReturnType<typeof parameterParserBuilder>) => {
    const diagnostics = new Diagnostics();
    const version = MEGALO_VERSIONS["107-mcc"];
    const tokens = new Lexer(version).lex(source, diagnostics);
    const symbolBinder = new SymbolBinder(version, diagnostics);
    const ctx = new ParserContext(tokens, version, diagnostics, symbolBinder);

    ctx.symbolParser.addVariableToScope({
        name: "round_timer",
        type: VariableType.Timer,
        declaration: BUILT_IN_LOCATION,
        scope: VariableScope.Global,
    });
    ctx.symbolParser.addVariableToScope({
        name: "meter_value",
        type: VariableType.Number,
        declaration: BUILT_IN_LOCATION,
        scope: VariableScope.Global,
    });
    ctx.symbolParser.addConstantToScope({
        name: "k_max_count",
        declaration: BUILT_IN_LOCATION,
    });
    ctx.symbolParser.addHudWidgetToScope("health_meter", tokens[0]!.location);
    ctx.symbolParser.addVariableToScope({
        name: "spawn_point",
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
        name: "the_hill",
        type: VariableType.Object,
        declaration: BUILT_IN_LOCATION,
        scope: VariableScope.Global,
    });
    ctx.symbolParser.addVariableToScope({
        name: "current_team",
        type: VariableType.Team,
        declaration: BUILT_IN_LOCATION,
        scope: VariableScope.Global,
    });
    ctx.symbolParser.addVariableToScope({
        name: "vip",
        type: VariableType.Player,
        declaration: BUILT_IN_LOCATION,
        scope: VariableScope.Team,
    });
    ctx.symbolParser.addVariableToScope({
        name: "current_player",
        type: VariableType.Player,
        declaration: BUILT_IN_LOCATION,
        scope: VariableScope.Global,
    });

    const anchor = tokens[0]!.location;
    const parameters = parser(ctx, anchor);
    return { parameters, diagnostics };
};

describe("parameterParserBuilder", () => {
    it("parses keyword parameters for initial_grenades", () => {
        const parser = parameterParserBuilder(
            [ParameterType.Number, ParameterType.Keyword],
        );

        const { parameters, diagnostics } = parseParameters("2 frag", parser);

        expect(diagnostics.hasErrors()).toBe(false);
        expect(parameters).toEqual([
            expect.objectContaining({ kind: SyntaxKind.INTEGER, value: 2 }),
            expect.objectContaining({ kind: SyntaxKind.KEYWORD, value: "frag" }),
        ]);
    });

    it("parses numeric constant references", () => {
        const parser = parameterParserBuilder(
            [ParameterType.Number, ParameterType.Keyword],
        );

        const { parameters, diagnostics } = parseParameters("k_max_count frag", parser);

        expect(diagnostics.hasErrors()).toBe(false);
        expect(parameters[0]).toMatchObject({
            kind: SyntaxKind.REFERENCE,
            identifier: "k_max_count",
        });
    });

    it("disambiguates hud_widget_set_meter signatures by reference type", () => {
        const parser = parameterParserBuilder(
            [ParameterType.HudWidget, KeywordParameter("off")],
            [ParameterType.HudWidget, ParameterType.Timer],
            [ParameterType.HudWidget, ParameterType.Number, ParameterType.Number],
        );

        const off = parseParameters("health_meter off", parser);
        expect(off.diagnostics.hasErrors()).toBe(false);
        expect(off.parameters).toHaveLength(2);
        expect(off.parameters[1]).toMatchObject({ kind: SyntaxKind.KEYWORD, value: "off" });

        const timer = parseParameters("health_meter round_timer", parser);
        expect(timer.diagnostics.hasErrors()).toBe(false);
        expect(timer.parameters).toHaveLength(2);
        expect(timer.parameters[1]).toMatchObject({
            kind: SyntaxKind.REFERENCE,
            identifier: "round_timer",
        });

        const numbers = parseParameters("health_meter 50 meter_value", parser);
        expect(numbers.diagnostics.hasErrors()).toBe(false);
        expect(numbers.parameters).toHaveLength(3);
        expect(numbers.parameters[1]).toMatchObject({ kind: SyntaxKind.INTEGER, value: 50 });
        expect(numbers.parameters[2]).toMatchObject({
            kind: SyntaxKind.REFERENCE,
            identifier: "meter_value",
        });
    });

    it("still consumes tokens when a parameter does not match the expected type", () => {
        const parser = parameterParserBuilder(
            [ParameterType.HudWidget, ParameterType.Number, ParameterType.Number],
        );

        const { parameters, diagnostics } = parseParameters("health_meter round_timer 50", parser);

        expect(diagnostics.hasErrors()).toBe(false);
        expect(parameters).toHaveLength(3);
        expect(parameters[1]).toMatchObject({
            kind: SyntaxKind.REFERENCE,
            identifier: "round_timer",
        });
    });

    it("lenient fallback selects the best matching signature, not the first", () => {
        const parser = parameterParserBuilder(
            [KeywordParameter("everyone"), OptionalParameter("immediate"), ParameterType.String],
            [KeywordParameter("player"), ParameterType.Player, OptionalParameter("immediate"), ParameterType.String],
            [KeywordParameter("team"), ParameterType.Team, OptionalParameter("immediate"), ParameterType.String],
        );

        const diagnostics = new Diagnostics();
        const version = MEGALO_VERSIONS["107-mcc"];
        const tokens = new Lexer(version).lex("player current_player vip", diagnostics);
        const symbolBinder = new SymbolBinder(version, diagnostics);
        const ctx = new ParserContext(tokens, version, diagnostics, symbolBinder);
        ctx.symbolParser.addVariableToScope({
            name: "current_player",
            type: VariableType.Player,
            declaration: BUILT_IN_LOCATION,
            scope: VariableScope.Global,
        });

        const parameters = parser(ctx, tokens[0]!.location);

        expect(diagnostics.hasErrors()).toBe(false);
        expect(parameters).toHaveLength(3);
        expect(parameters[0]).toMatchObject({ kind: SyntaxKind.KEYWORD, value: "player" });
        expect(parameters[2]).toMatchObject({ kind: SyntaxKind.KEYWORD, value: "vip" });
        expect(ctx.hasMore()).toBe(false);
    });

    it("parses keyword unions at a single parameter position", () => {
        const parser = parameterParserBuilder([
            ParameterType.Object,
            [KeywordParameter("low"), KeywordParameter("normal"), KeywordParameter("high"), KeywordParameter("blink")],
        ]);

        const { parameters, diagnostics } = parseParameters("the_hill high", parser);

        expect(diagnostics.hasErrors()).toBe(false);
        expect(parameters).toHaveLength(2);
        expect(parameters[1]).toMatchObject({ kind: SyntaxKind.KEYWORD, value: "high" });
    });

    it("parses optional flag parameters when present", () => {
        const parser = parameterParserBuilder([
            ParameterType.Object,
            OptionalParameter("no_statistics"),
        ]);

        const withFlag = parseParameters("the_hill no_statistics", parser);
        expect(withFlag.diagnostics.hasErrors()).toBe(false);
        expect(withFlag.parameters).toHaveLength(2);
        expect(withFlag.parameters[1]).toMatchObject({ kind: SyntaxKind.KEYWORD, value: "no_statistics" });

        const withoutFlag = parseParameters("the_hill", parser);
        expect(withoutFlag.diagnostics.hasErrors()).toBe(false);
        expect(withoutFlag.parameters).toHaveLength(1);
    });

    it("parses optional parameters with values", () => {
        const parser = parameterParserBuilder([
            ParameterType.Keyword,
            KeywordParameter("at"),
            ParameterType.Object,
            OptionalParameter("set", ParameterType.Object),
            OptionalParameter("never_garbage"),
        ]);

        const { parameters, diagnostics } = parseParameters(
            "wall_device at spawn_point set created_object never_garbage",
            parser,
        );

        expect(diagnostics.hasErrors()).toBe(false);
        expect(parameters).toHaveLength(6);
        expect(parameters[3]).toMatchObject({ kind: SyntaxKind.KEYWORD, value: "set" });
        expect(parameters[5]).toMatchObject({ kind: SyntaxKind.KEYWORD, value: "never_garbage" });
    });

    it("parses empty signatures", () => {
        const parser = parameterParserBuilder();
        const diagnostics = new Diagnostics();
        const version = MEGALO_VERSIONS["107-mcc"];
        const tokens = new Lexer(version).lex("unused", diagnostics);
        const ctx = new ParserContext(tokens, version, diagnostics, new SymbolBinder(version, diagnostics));

        expect(parser(ctx, BUILT_IN_LOCATION)).toEqual([]);
        expect(diagnostics.hasErrors()).toBe(false);
    });

    it("parses math operations as operator or keyword tokens", () => {
        const parser = parameterParserBuilder([ParameterType.MathOperation, ParameterType.Number]);

        const keyword = parseParameters("set_to 1", parser);
        expect(keyword.diagnostics.hasErrors()).toBe(false);
        expect(keyword.parameters[0]).toMatchObject({ kind: SyntaxKind.KEYWORD, value: "set_to" });

        const operator = parseParameters("+= 1", parser);
        expect(operator.diagnostics.hasErrors()).toBe(false);
        expect(operator.parameters[0]).toMatchObject({ kind: SyntaxKind.KEYWORD, value: "+=" });
    });

    it("parses member variable references as a single parameter", () => {
        const parser = parameterParserBuilder([ParameterType.Player, ParameterType.Player]);

        const { parameters, diagnostics } = parseParameters(
            "current_team.vip current_player",
            parser,
        );

        expect(diagnostics.hasErrors()).toBe(false);
        expect(parameters).toHaveLength(2);
        expect(parameters[0]).toMatchObject({
            kind: SyntaxKind.MEMBER_REFERENCE,
            root: "current_team",
            member: { value: "vip" },
        });
        expect(parameters[1]).toMatchObject({
            kind: SyntaxKind.REFERENCE,
            identifier: "current_player",
        });
    });

    it("parses a single member reference level", () => {
        const parser = parameterParserBuilder([ParameterType.Number]);

        const { parameters, diagnostics } = parseParameters("current_player.score", parser);

        expect(diagnostics.hasErrors()).toBe(false);
        expect(parameters).toHaveLength(1);
        expect(parameters[0]).toMatchObject({
            kind: SyntaxKind.MEMBER_REFERENCE,
            root: "current_player",
            member: { value: "score" },
        });
    });

    it("leniently consumes member references when the root is unresolved", () => {
        const parser = parameterParserBuilder([ParameterType.Object, ParameterType.Player]);

        const { parameters, diagnostics } = parseParameters(
            "the_hill unknown_team.vip",
            parser,
        );

        expect(diagnostics.hasErrors()).toBe(false);
        expect(parameters).toHaveLength(2);
        expect(parameters[1]).toMatchObject({
            kind: SyntaxKind.MEMBER_REFERENCE,
            root: "unknown_team",
            member: { value: "vip" },
        });
    });
});
