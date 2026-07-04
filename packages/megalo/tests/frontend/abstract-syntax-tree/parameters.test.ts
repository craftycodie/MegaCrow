import { describe, expect, it } from "vitest";
import { ParserContext } from "../../../frontend/abstract-syntax-tree/context";
import {
    KeywordParameter,
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

    it("rejects timer variables when a number parameter is required", () => {
        const parser = parameterParserBuilder(
            [ParameterType.HudWidget, ParameterType.Number, ParameterType.Number],
        );

        const { diagnostics } = parseParameters("health_meter round_timer 50", parser);

        expect(diagnostics.hasErrors()).toBe(true);
    });
});
