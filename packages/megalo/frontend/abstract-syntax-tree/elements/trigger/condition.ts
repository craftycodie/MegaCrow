import { MegaloVersion } from "../../../../version";
import { ASTNode, SyntaxKind } from "../../kinds";
import { SourceCodeLocation, SourceLocationType } from "../../../diagnostics";
import { diagnosticMessages } from "../../../diagnostics/messages";
import { Token, TokenKind } from "../../../tokens";
import { ParserContext } from "../../context";
import {
    DISPOSITION_KEYWORDS,
    KILLER_TYPE_KEYWORDS,
} from "../../../language-configuration/omni/conditions";
import {
    ASTConditionOperandNode,
    ConditionOperandParser,
    conditionOperandsParser,
    isComparisonToken,
    parseIfOperand,
    parseKeywordOperand,
    parseObjectOperand,
    parsePlayerOperand,
    parseTeamOperand,
    parseTimerOperand,
} from "./operand";

export type ConditionStatementNode = ASTNode<SyntaxKind.CONDITION> & {
    negated: boolean;
    unionOr: boolean;
    name: { value: string; location: SourceCodeLocation };
    operands: ASTConditionOperandNode[];
};

const locationSpan = (start: SourceCodeLocation, end: SourceCodeLocation): SourceCodeLocation => ({
    type: SourceLocationType.SOURCE_CODE,
    start: start.start,
    end: end.end,
});

const parseConditionName = (
    ctx: ParserContext,
    anchor: Token,
): ConditionStatementNode["name"] | undefined => {
    const token = ctx.peekToken();
    if (token?.kind !== TokenKind.Identifier) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedTokenKind(TokenKind.Identifier, token?.kind ?? TokenKind.None, token?.value ?? ""),
            token?.location ?? anchor.location,
        );
        return undefined;
    }

    const nameToken = ctx.getToken();
    return {
        value: nameToken.value,
        location: nameToken.location,
    };
};

const consumeTrailingOr = (ctx: ParserContext): boolean => {
    const token = ctx.peekToken();
    if (token?.kind === TokenKind.Identifier && token.value === "or") {
        ctx.getToken();
        return true;
    }

    return false;
};

export const parseCondition = (
    ctx: ParserContext,
    conditionToken: Token,
): ConditionStatementNode => {
    let negated = false;

    const maybeNot = ctx.peekToken();
    if (maybeNot?.kind === TokenKind.Identifier && maybeNot.value === "not") {
        ctx.getToken();
        negated = true;
    }

    const name = parseConditionName(ctx, conditionToken);
    if (name === undefined) {
        return {
            kind: SyntaxKind.CONDITION,
            negated,
            unionOr: false,
            name: {
                value: "",
                location: conditionToken.location,
            },
            operands: [],
            location: conditionToken.location,
        };
    }

    const parser = ctx.conditionParserRepository.getParser(name.value);
    const operands = parser
        ? parser(ctx, name.location)
        : (ctx.diagnostics.addError(
            diagnosticMessages.unknownCondition(name.value),
            name.location,
        ), []);

    const unionOr = consumeTrailingOr(ctx);

    const lastOperand = operands.at(-1);
    const endLocation = lastOperand !== undefined && lastOperand.kind !== SyntaxKind.INVALID
        ? lastOperand.location
        : name.location;

    return {
        kind: SyntaxKind.CONDITION,
        negated,
        unionOr,
        name,
        operands,
        location: locationSpan(conditionToken.location, endLocation),
    };
};

const parseIfConditionOperands = (
    ctx: ParserContext,
    anchor: SourceCodeLocation,
): ASTConditionOperandNode[] => {
    const left = parseIfOperand(ctx, anchor);

    const comparisonToken = ctx.peekToken();
    if (
        comparisonToken === undefined
        || !isComparisonToken(comparisonToken.kind, comparisonToken.value)
    ) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedParameterType("comparison operator", comparisonToken?.value ?? ""),
            comparisonToken?.location ?? anchor,
        );
        return [left];
    }

    const consumedComparison = ctx.getToken();
    const comparison: ASTConditionOperandNode = {
        kind: SyntaxKind.KEYWORD,
        value: consumedComparison.value,
        location: consumedComparison.location,
    };

    const right = parseIfOperand(ctx, anchor);
    return [left, comparison, right];
};

export class ConditionParserRepository {
    private readonly parsers = new Map<string, ConditionOperandParser>();

    private registerParser(name: string, parser: ConditionOperandParser) {
        this.parsers.set(name, parser);
    }

    private registerParsers(_megaloVersion: MegaloVersion) {
        this.registerParser("if", parseIfConditionOperands);

        this.registerParser("object_in_area", conditionOperandsParser(
            parseObjectOperand,
            parseObjectOperand,
        ));

        this.registerParser("player_died", conditionOperandsParser(
            parsePlayerOperand,
            (ctx, anchor) => parseKeywordOperand(ctx, anchor, KILLER_TYPE_KEYWORDS),
        ));

        this.registerParser("team_disposition", conditionOperandsParser(
            parseTeamOperand,
            (ctx, anchor) => parseKeywordOperand(ctx, anchor, DISPOSITION_KEYWORDS),
            parseTeamOperand,
        ));

        this.registerParser("timer_expired", conditionOperandsParser(parseTimerOperand));

        this.registerParser("object_is_type", conditionOperandsParser(
            parseObjectOperand,
            (ctx, anchor) => {
                const token = ctx.peekToken();
                if (token?.kind === TokenKind.QuotedString) {
                    const stringToken = ctx.getToken();
                    return {
                        kind: SyntaxKind.QUOTED_STRING,
                        value: stringToken.value,
                        location: stringToken.location,
                    };
                }

                if (token?.kind === TokenKind.Integer) {
                    const integerToken = ctx.getToken();
                    return {
                        kind: SyntaxKind.INTEGER,
                        value: Number.parseInt(integerToken.value, 10),
                        location: integerToken.location,
                    };
                }

                return parseKeywordOperand(ctx, anchor);
            },
        ));

        this.registerParser("team_is_active", conditionOperandsParser(parseTeamOperand));

        this.registerParser("object_out_of_bounds", conditionOperandsParser(parseObjectOperand));

        this.registerParser("player_is_fire_team_leader", conditionOperandsParser(parsePlayerOperand));

        this.registerParser("player_assisted_with_kill", conditionOperandsParser(
            parsePlayerOperand,
            parsePlayerOperand,
        ));

        this.registerParser("object_matches_filter", conditionOperandsParser(
            parseObjectOperand,
            parseKeywordOperand,
        ));

        this.registerParser("player_is_active", conditionOperandsParser(parsePlayerOperand));

        this.registerParser("equipment_is_active", conditionOperandsParser(parseObjectOperand));

        this.registerParser("player_is_spartan", conditionOperandsParser(parsePlayerOperand));

        this.registerParser("player_is_elite", conditionOperandsParser(parsePlayerOperand));

        this.registerParser("player_is_editor", conditionOperandsParser(parsePlayerOperand));

        this.registerParser("game_is_forge", () => []);
    }

    public constructor(megaloVersion: MegaloVersion) {
        this.registerParsers(megaloVersion);
    }

    public getParser(name: string): ConditionOperandParser | undefined {
        return this.parsers.get(name);
    }
}
