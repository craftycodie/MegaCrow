import { describe, expect, it } from "vitest";
import { parseCondition } from "../../../frontend/abstract-syntax-tree/elements/trigger/condition";
import { ParserContext } from "../../../frontend/abstract-syntax-tree/context";
import { SyntaxKind } from "../../../frontend/abstract-syntax-tree/kinds";
import { Diagnostics, BUILT_IN_LOCATION } from "../../../frontend/diagnostics";
import { SymbolBinder, VariableScope, VariableType } from "../../../frontend/symbol-table";
import { Lexer, TokenKind } from "../../../frontend/tokens";
import { MEGALO_VERSIONS } from "../../../version";

const parseConditionLine = (source: string) => {
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
        name: "round_timer",
        type: VariableType.Timer,
        declaration: BUILT_IN_LOCATION,
        scope: VariableScope.Global,
    });
    ctx.symbolParser.addGameOptionToScope({
        name: "score_to_win_round",
        type: VariableType.Number,
        declaration: BUILT_IN_LOCATION,
    });
    ctx.symbolParser.addGameOptionToScope({
        name: "teams_enabled",
        type: VariableType.Number,
        declaration: BUILT_IN_LOCATION,
    });
    ctx.symbolParser.addConstantToScope({
        name: "true",
        declaration: BUILT_IN_LOCATION,
    });

    const conditionToken = tokens.find((token) => token.value === "condition")!;
    const conditionIndex = tokens.indexOf(conditionToken);
    ctx.reset(conditionIndex + 1);

    const condition = parseCondition(ctx, conditionToken);
    return { condition, diagnostics, tokens, ctx };
};

describe("parseCondition", () => {
    it("parses if conditions with symbolic comparison operators", () => {
        const { condition, diagnostics } = parseConditionLine("condition if score_to_win_round != 0");

        expect(diagnostics.hasErrors()).toBe(false);
        expect(condition.name.value).toBe("if");
        expect(condition.negated).toBe(false);
        expect(condition.operands).toHaveLength(3);
        expect(condition.operands[0]).toMatchObject({
            kind: SyntaxKind.REFERENCE,
            identifier: "score_to_win_round",
        });
        expect(condition.operands[1]).toMatchObject({ kind: SyntaxKind.KEYWORD, value: "!=" });
        expect(condition.operands[2]).toMatchObject({ kind: SyntaxKind.INTEGER, value: 0 });
    });

    it("parses if conditions with equal_to keyword comparisons", () => {
        const { condition, diagnostics } = parseConditionLine("condition if teams_enabled == 1");

        expect(diagnostics.hasErrors()).toBe(false);
        expect(condition.operands[1]).toMatchObject({ kind: SyntaxKind.KEYWORD, value: "==" });
    });

    it("parses negated if conditions with member variables", () => {
        const { condition, diagnostics } = parseConditionLine(
            "condition not if current_player.heard_game_start == 0",
        );

        expect(diagnostics.hasErrors()).toBe(false);
        expect(condition.negated).toBe(true);
        expect(condition.operands[0]).toMatchObject({
            kind: SyntaxKind.MEMBER_REFERENCE,
            root: "current_player",
            member: { value: "heard_game_start" },
        });
    });

    it("binds team designator roots on member references", () => {
        const { condition, diagnostics, ctx } = parseConditionLine(
            "condition if current_player equal_to attackers.vip",
        );

        expect(diagnostics.hasErrors()).toBe(false);
        const attackersId = ctx.symbolParser.lookupSymbol("attackers");
        expect(attackersId).toBeDefined();
        expect(condition.operands[2]).toMatchObject({
            kind: SyntaxKind.MEMBER_REFERENCE,
            root: "attackers",
            rootSymbolId: attackersId,
            member: { value: "vip" },
        });
    });

    it("parses player_died conditions", () => {
        const { condition, diagnostics } = parseConditionLine("condition player_died current_player enemy");

        expect(diagnostics.hasErrors()).toBe(false);
        expect(condition.name.value).toBe("player_died");
        expect(condition.operands[0]).toMatchObject({
            kind: SyntaxKind.REFERENCE,
            identifier: "current_player",
        });
        expect(condition.operands[1]).toMatchObject({ kind: SyntaxKind.KEYWORD, value: "enemy" });
    });

    it("parses timer_expired with member timer references", () => {
        const { condition, diagnostics } = parseConditionLine(
            "condition timer_expired current_player.game_start_vo",
        );

        expect(diagnostics.hasErrors()).toBe(false);
        expect(condition.name.value).toBe("timer_expired");
        expect(condition.operands[0]).toMatchObject({
            kind: SyntaxKind.MEMBER_REFERENCE,
            root: "current_player",
            member: { value: "game_start_vo" },
        });
    });

    it("parses trailing or", () => {
        const { condition, diagnostics } = parseConditionLine("condition if teams_enabled == 1 or");

        expect(diagnostics.hasErrors()).toBe(false);
        expect(condition.unionOr).toBe(true);
    });

    it("parses game_is_forge without operands", () => {
        const { condition, diagnostics } = parseConditionLine("condition game_is_forge");

        expect(diagnostics.hasErrors()).toBe(false);
        expect(condition.name.value).toBe("game_is_forge");
        expect(condition.operands).toEqual([]);
    });

    it("accepts a player reference where an object operand is expected", () => {
        const { condition, diagnostics } = parseConditionLine(
            "condition object_in_area current_player the_hill",
        );

        expect(diagnostics.hasErrors()).toBe(false);
        expect(condition.name.value).toBe("object_in_area");
        expect(condition.operands[0]).toMatchObject({
            kind: SyntaxKind.REFERENCE,
            identifier: "current_player",
        });
        expect(condition.operands[1]).toMatchObject({
            kind: SyntaxKind.REFERENCE,
            identifier: "the_hill",
        });
    });
});

describe("comparison operator lexing", () => {
    it("tokenizes symbolic comparison operators", () => {
        const tokens = new Lexer(MEGALO_VERSIONS["107-mcc"]).lex("== != <= >=", new Diagnostics());
        expect(tokens.map((token) => [token.kind, token.value])).toEqual([
            [TokenKind.Operator, "=="],
            [TokenKind.Operator, "!="],
            [TokenKind.Operator, "<="],
            [TokenKind.Operator, ">="],
        ]);
    });
});
