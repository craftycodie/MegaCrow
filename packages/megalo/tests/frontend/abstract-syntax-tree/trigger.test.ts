import { describe, expect, it } from "vitest";
import { ElementKind } from "../../../frontend/abstract-syntax-tree/elements";
import { Parser, SyntaxKind } from "../../../frontend/abstract-syntax-tree";
import { triggerParser } from "../../../frontend/abstract-syntax-tree/elements/trigger";
import { ParserContext } from "../../../frontend/abstract-syntax-tree/context";
import { Diagnostics, BUILT_IN_LOCATION } from "../../../frontend/diagnostics";
import { SymbolBinder, VariableScope, VariableType } from "../../../frontend/symbol-table";
import { Lexer } from "../../../frontend/tokens";
import { MEGALO_VERSIONS } from "../../../version";

const setupContext = (source: string) => {
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
    ctx.symbolParser.addGameOptionToScope({
        name: "score_to_win_round",
        type: VariableType.Number,
        declaration: BUILT_IN_LOCATION,
    });
    ctx.symbolParser.addStringToScope({
        name: "test_string",
        language: "english",
        content: "test",
        declaration: BUILT_IN_LOCATION,
    });

    return { ctx, diagnostics, tokens };
};

const parseTriggerSource = (triggerName: string, body: string, setupSymbols = setupContext) => {
    const source = `trigger ${triggerName}\n${body}\nend`;
    const { ctx, diagnostics, tokens } = setupSymbols(source);
    const triggerToken = tokens.find((token) => token.value === "trigger")!;
    ctx.reset(tokens.indexOf(triggerToken) + 1);

    const element = triggerParser(ctx, triggerToken);
    return { element, diagnostics, ctx };
};

const setupMinimalContext = (source: string) => {
    const diagnostics = new Diagnostics();
    const version = MEGALO_VERSIONS["107-mcc"];
    const tokens = new Lexer(version).lex(source, diagnostics);
    const symbolBinder = new SymbolBinder(version, diagnostics);
    const ctx = new ParserContext(tokens, version, diagnostics, symbolBinder);
    return { ctx, diagnostics, tokens };
};

const parseTriggerElement = (body: string) => {
    const source = `trigger test_trigger\n${body}\nend`;
    const { ctx, diagnostics, tokens } = setupContext(source);
    const triggerToken = tokens.find((token) => token.value === "trigger")!;
    ctx.reset(tokens.indexOf(triggerToken) + 1);

    const element = triggerParser(ctx, triggerToken);
    return { element, diagnostics, ctx };
};

describe("triggerParser", () => {
    it("parses a trigger body with condition, action, and nested begin", () => {
        const { element, diagnostics } = parseTriggerElement(
            "\tcondition game_is_forge\n\taction print_variable test_string\n\tbegin\n\t\taction end_round\n\tend",
        );

        expect(diagnostics.hasErrors()).toBe(false);
        expect(element.elementKind).toBe(ElementKind.TRIGGER);
        expect(element.name.value).toBe("test_trigger");
        expect(element.statements).toHaveLength(3);

        expect(element.statements[0]).toMatchObject({
            kind: SyntaxKind.CONDITION,
            name: { value: "game_is_forge" },
        });
        expect(element.statements[1]).toMatchObject({
            kind: SyntaxKind.ACTION,
            name: { value: "print_variable" },
            parameters: [
                expect.objectContaining({
                    kind: SyntaxKind.DYNAMIC_STRING,
                    string: expect.objectContaining({
                        kind: SyntaxKind.REFERENCE,
                        identifier: "test_string",
                    }),
                    replacements: [],
                }),
            ],
        });
        expect(element.statements[2]).toMatchObject({
            kind: SyntaxKind.BEGIN,
            statements: [
                {
                    kind: SyntaxKind.ACTION,
                    name: { value: "end_round" },
                },
            ],
        });
    });

    it("consumes an optional begin keyword on the trigger header", () => {
        const source = "trigger test_trigger begin\n\taction end_round\nend";
        const { ctx, diagnostics, tokens } = setupContext(source);
        const triggerToken = tokens.find((token) => token.value === "trigger")!;
        ctx.reset(tokens.indexOf(triggerToken) + 1);

        const element = triggerParser(ctx, triggerToken);

        expect(diagnostics.hasErrors()).toBe(false);
        expect(element.statements).toHaveLength(1);
        expect(element.statements[0]).toMatchObject({
            kind: SyntaxKind.ACTION,
            name: { value: "end_round" },
        });
    });

    it("reports unknown trigger statements", () => {
        const { diagnostics } = parseTriggerElement("\tfoo bar");

        expect(diagnostics.hasErrors()).toBe(true);
        expect(diagnostics.getErrors()[0]?.message).toContain("Unrecognized element 'foo'");
    });

    it("restores scope after parsing a trigger", () => {
        const { ctx, diagnostics, tokens } = setupContext("trigger test_trigger\n\taction end_round\nend");
        expect(ctx.symbolParser.currentScopeIsGlobal()).toBe(true);

        const triggerToken = tokens.find((token) => token.value === "trigger")!;
        ctx.reset(tokens.indexOf(triggerToken) + 1);
        triggerParser(ctx, triggerToken);

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ctx.symbolParser.currentScopeIsGlobal()).toBe(true);
    });

    it("restores scope after parsing nested begin blocks", () => {
        const { ctx, diagnostics } = parseTriggerElement(
            "\tbegin\n\t\tbegin\n\t\t\taction end_round\n\t\tend\n\tend",
        );

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ctx.symbolParser.currentScopeIsGlobal()).toBe(true);
    });

    it("parses temporary variable declarations", () => {
        const { element, diagnostics } = parseTriggerElement(
            "\ttemporary player killing_player none\n\ttemporary number phase 1\n\ttemporary player dead_player current_player\n\ttemporary team victim_team current_player.team",
        );

        expect(diagnostics.hasErrors()).toBe(false);
        expect(element.statements).toHaveLength(4);

        expect(element.statements[0]).toMatchObject({
            kind: SyntaxKind.TEMPORARY,
            storage: { value: "player" },
            name: { value: "killing_player" },
            initial: { kind: SyntaxKind.REFERENCE, identifier: "none" },
        });
        expect(element.statements[1]).toMatchObject({
            kind: SyntaxKind.TEMPORARY,
            storage: { value: "number" },
            name: { value: "phase" },
            initial: { kind: SyntaxKind.INTEGER, value: 1 },
        });
        expect(element.statements[2]).toMatchObject({
            kind: SyntaxKind.TEMPORARY,
            storage: { value: "player" },
            name: { value: "dead_player" },
            initial: { kind: SyntaxKind.REFERENCE, identifier: "current_player" },
        });
        expect(element.statements[3]).toMatchObject({
            kind: SyntaxKind.TEMPORARY,
            storage: { value: "team" },
            name: { value: "victim_team" },
            initial: {
                kind: SyntaxKind.MEMBER_REFERENCE,
                root: "current_player",
                member: { value: "team" },
            },
        });
    });

    it("registers temporaries in the trigger scope for later statements", () => {
        const { diagnostics } = parseTriggerElement(
            "\ttemporary player killing_player none\n\taction get_player_holding_object the_hill killing_player",
        );

        expect(diagnostics.hasErrors()).toBe(false);
    });

    it("reports invalid temporary storage types", () => {
        const { diagnostics } = parseTriggerElement("\ttemporary timer bad_name none");

        expect(diagnostics.hasErrors()).toBe(true);
        expect(diagnostics.getErrors()[0]?.message).toContain("'timer'");
    });

    it("reports missing temporary initial values", () => {
        const { diagnostics } = parseTriggerElement("\ttemporary player killing_player\n\taction end_round");

        expect(diagnostics.hasErrors()).toBe(true);
        expect(diagnostics.getErrors()[0]?.message).toContain("initial value");
    });

    it("does not leak temporary variables outside the trigger scope", () => {
        const { ctx, diagnostics } = parseTriggerElement("\ttemporary player killing_player none");

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ctx.symbolParser.lookupSymbol("killing_player")).toBeUndefined();
    });

    it("parses action begin with a scoped body", () => {
        const { element, diagnostics } = parseTriggerElement(
            "\taction begin\n\t\taction end_round\n\tend",
        );

        expect(diagnostics.hasErrors()).toBe(false);
        expect(element.statements).toHaveLength(1);
        expect(element.statements[0]).toMatchObject({
            kind: SyntaxKind.BEGIN,
            statements: [
                {
                    kind: SyntaxKind.ACTION,
                    name: { value: "end_round" },
                },
            ],
        });
    });

    it("parses action for_each with a scoped body", () => {
        const { element, diagnostics } = parseTriggerElement(
            "\taction for_each general\n\t\tcondition game_is_forge\n\t\taction end_round\n\tend",
        );

        expect(diagnostics.hasErrors()).toBe(false);
        expect(element.statements).toHaveLength(1);
        expect(element.statements[0]).toMatchObject({
            kind: SyntaxKind.FOR_EACH,
            target: { value: "general" },
            statements: [
                {
                    kind: SyntaxKind.CONDITION,
                    name: { value: "game_is_forge" },
                },
                {
                    kind: SyntaxKind.ACTION,
                    name: { value: "end_round" },
                },
            ],
        });
    });

    it("scopes temporaries declared inside action for_each", () => {
        const { ctx, diagnostics } = parseTriggerElement(
            "\taction for_each player\n\t\ttemporary player inner_player none\n\t\taction get_player_holding_object the_hill inner_player\n\tend",
        );

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ctx.symbolParser.lookupSymbol("inner_player")).toBeUndefined();
    });

    it("adds object_death built-ins when entering an object_death trigger scope", () => {
        const { diagnostics } = parseTriggerSource(
            "object_death",
            "\tcondition if object_death_damage_type != 0",
            setupMinimalContext,
        );

        expect(diagnostics.hasErrors()).toBe(false);
    });

    it("adds current_player when entering a player trigger scope", () => {
        const { diagnostics } = parseTriggerSource(
            "player",
            "\tcondition player_is_active current_player",
            setupMinimalContext,
        );

        expect(diagnostics.hasErrors()).toBe(false);
    });

    it("adds current_player when entering an action for_each player scope", () => {
        const { diagnostics } = parseTriggerSource(
            "initialization",
            "\taction for_each player\n\t\tcondition player_is_active current_player\n\tend",
            setupMinimalContext,
        );

        expect(diagnostics.hasErrors()).toBe(false);
    });

    it("consumes play_sound parameters so the sound name is not treated as a statement", () => {
        const { element, diagnostics } = parseTriggerElement(
            "\taction play_sound player current_player vip",
        );

        expect(diagnostics.hasErrors()).toBe(false);
        expect(element.statements).toHaveLength(1);

        const statement = element.statements[0]!;
        expect(statement.kind).toBe(SyntaxKind.ACTION);
        if (statement.kind !== SyntaxKind.ACTION) {
            return;
        }

        expect(statement.name.value).toBe("play_sound");
        expect(statement.parameters).toHaveLength(3);
        expect(statement.parameters[2]).toMatchObject({
            kind: SyntaxKind.KEYWORD,
            value: "vip",
        });
    });
});

describe("trigger element integration", () => {
    it("parses trigger through the top-level parser", () => {
        const diagnostics = new Diagnostics();
        const version = MEGALO_VERSIONS["107-mcc"];
        const source = `string_table english
\ttest_string "hello"
end
trigger initialization
\tcondition game_is_forge
\taction print_variable test_string
end
`;
        const tokens = new Lexer(version).lex(source, diagnostics);
        const { ast } = new Parser(version).parse(tokens, diagnostics);

        expect(diagnostics.hasErrors()).toBe(false);
        expect(ast.failed).toBe(false);

        const trigger = ast.elements[1]!;
        expect(trigger.elementKind).toBe(ElementKind.TRIGGER);
        if (trigger.elementKind !== ElementKind.TRIGGER) {
            return;
        }

        expect(trigger.name.value).toBe("initialization");
        expect(trigger.statements).toHaveLength(2);
    });
});
