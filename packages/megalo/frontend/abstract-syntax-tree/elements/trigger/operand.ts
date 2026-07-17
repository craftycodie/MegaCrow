import {
    ASTKeywordParameterNode,
    ASTParameterNode,
    ParameterType,
    KeywordParameter,
    ObjectListParameter,
    parseMemberReference,
    parseParameterValue,
    tryParseParameterValue,
} from "../../parameters";
import {
    ASTErrorNode,
    ASTIntegerNode,
    ASTMemberReferenceNode,
    ASTNode,
    ASTReferenceNode,
    SyntaxKind,
} from "../../kinds";
import { SourceCodeLocation } from "../../../diagnostics";
import { diagnosticMessages } from "../../../diagnostics/messages";
import { ObjectListType } from "../../../object-lists";
import { TokenKind } from "../../../tokens";
import { ParserContext } from "../../context";

export type ASTConditionOperandNode =
    | ASTIntegerNode
    | ASTKeywordParameterNode
    | ASTReferenceNode
    | ASTMemberReferenceNode
    | (ASTNode<SyntaxKind.QUOTED_STRING> & { value: string })
    | ASTParameterNode
    | ASTErrorNode;

export const COMPARISON_OPERATOR_NAMES = [
    "equal_to",
    "not_equal_to",
    "less_than",
    "greater_than",
    "less_than_or_equal_to",
    "greater_than_or_equal_to",
] as const;

export type ComparisonOperatorName = (typeof COMPARISON_OPERATOR_NAMES)[number];

export const isComparisonOperatorName = (value: string): value is ComparisonOperatorName =>
    (COMPARISON_OPERATOR_NAMES as readonly string[]).includes(value);

export const isComparisonToken = (kind: TokenKind, value: string): boolean =>
    kind === TokenKind.Operator || (kind === TokenKind.Identifier && isComparisonOperatorName(value));

/**
 * Loose left/right operand for `if` comparisons: number, any in-scope symbol, member ref, or keyword.
 */
export const parseIfOperand = (
    ctx: ParserContext,
    anchor: SourceCodeLocation,
): ASTConditionOperandNode => {
    const token = ctx.peekToken();
    if (token?.kind === TokenKind.Integer) {
        const node = tryParseParameterValue(ctx, ParameterType.Number);
        if (node !== undefined) {
            return node;
        }
    }

    if (token?.kind !== TokenKind.Identifier) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedParameterType("operand", token?.value ?? ""),
            token?.location ?? anchor,
        );
        return {
            kind: SyntaxKind.INVALID,
            location: anchor,
        };
    }

    if (ctx.peekToken(1)?.kind === TokenKind.MemberVariableSeparator) {
        const rootToken = ctx.getToken();
        return parseMemberReference(ctx, rootToken);
    }

    const typed = tryParseParameterValue(
        ctx,
        ParameterType.Number,
        ParameterType.Timer,
        ParameterType.Team,
        ParameterType.Player,
        ParameterType.Object,
    );
    if (typed !== undefined) {
        return typed;
    }

    // Unresolved identifier -> keyword (e.g. comparison-adjacent tokens shouldn't appear here)
    const keywordToken = ctx.getToken();
    return {
        kind: SyntaxKind.KEYWORD,
        value: keywordToken.value,
        location: keywordToken.location,
    };
};

export const parseTypedOperand = (
    ctx: ParserContext,
    anchor: SourceCodeLocation,
    type: ParameterType,
): ASTConditionOperandNode => {
    const node = tryParseParameterValue(ctx, type);
    if (node !== undefined) {
        return node;
    }

    const token = ctx.peekToken();
    ctx.diagnostics.addError(
        diagnosticMessages.expectedParameterType(parameterTypeLabel(type), token?.value ?? ""),
        token?.location ?? anchor,
    );

    if (token !== undefined) {
        ctx.getToken();
        return {
            kind: SyntaxKind.INVALID,
            location: token.location,
        };
    }

    return {
        kind: SyntaxKind.INVALID,
        location: anchor,
    };
};

export const parseKeywordOperand = (
    ctx: ParserContext,
    anchor: SourceCodeLocation,
    allowed?: readonly string[],
): ASTConditionOperandNode => {
    if (allowed !== undefined && allowed.length > 0) {
        const node = tryParseParameterValue(
            ctx,
            ...allowed.map((value) => KeywordParameter(value)),
        );
        if (node !== undefined) {
            return node;
        }

        const token = ctx.peekToken();
        ctx.diagnostics.addError(
            diagnosticMessages.expectedParameterType(allowed.map((value) => `'${value}'`).join(" | "), token?.value ?? ""),
            token?.location ?? anchor,
        );
        if (token !== undefined) {
            ctx.getToken();
            return {
                kind: SyntaxKind.INVALID,
                location: token.location,
            };
        }
        return {
            kind: SyntaxKind.INVALID,
            location: anchor,
        };
    }

    return parseParameterValue(ctx, anchor, ParameterType.Keyword);
};

export const parseObjectOperand = (
    ctx: ParserContext,
    anchor: SourceCodeLocation,
): ASTConditionOperandNode => parseTypedOperand(ctx, anchor, ParameterType.Object);

export const parsePlayerOperand = (
    ctx: ParserContext,
    anchor: SourceCodeLocation,
): ASTConditionOperandNode => parseTypedOperand(ctx, anchor, ParameterType.Player);

export const parseTeamOperand = (
    ctx: ParserContext,
    anchor: SourceCodeLocation,
): ASTConditionOperandNode => parseTypedOperand(ctx, anchor, ParameterType.Team);

export const parseTimerOperand = (
    ctx: ParserContext,
    anchor: SourceCodeLocation,
): ASTConditionOperandNode => parseTypedOperand(ctx, anchor, ParameterType.Timer);

const parameterTypeLabel = (type: ParameterType): string => {
    switch (type) {
        case ParameterType.Number:
            return "number";
        case ParameterType.Timer:
            return "timer";
        case ParameterType.Team:
            return "team";
        case ParameterType.Player:
            return "player";
        case ParameterType.Object:
            return "object";
        default:
            return "operand";
    }
};

export type ConditionOperandParser = (
    ctx: ParserContext,
    anchor: SourceCodeLocation,
) => ASTConditionOperandNode[];

export const conditionOperandsParser = (
    ...parsers: ((ctx: ParserContext, anchor: SourceCodeLocation) => ASTConditionOperandNode)[]
): ConditionOperandParser => (ctx, anchor) => parsers.map((parser) => parser(ctx, anchor));

/** Object list entry for object type names (objects.txt). */
export const ObjectTypeListParameter = ObjectListParameter(ObjectListType.Objects);
