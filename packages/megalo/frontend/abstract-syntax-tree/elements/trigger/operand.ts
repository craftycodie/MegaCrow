import { ASTKeywordParameterNode, ParameterType, parseMemberReference } from "../../parameters";
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
import { SymbolKind, VariableType } from "../../../symbol-table";
import { TokenKind } from "../../../tokens";
import { ParserContext } from "../../context";

export type ASTConditionOperandNode =
    | ASTIntegerNode
    | ASTKeywordParameterNode
    | ASTReferenceNode
    | ASTMemberReferenceNode
    | (ASTNode<SyntaxKind.QUOTED_STRING> & { value: string })
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

const matchesVariableType = (ctx: ParserContext, symbolId: number, type: ParameterType): boolean => {
    const entry = ctx.symbolParser.getSymbolEntry(symbolId);
    if (entry === undefined || entry.kind !== SymbolKind.Variable) {
        return false;
    }

    switch (type) {
        case ParameterType.Number:
            return entry.type === VariableType.Number;
        case ParameterType.Timer:
            return entry.type === VariableType.Timer;
        case ParameterType.Team:
            return entry.type === VariableType.Team;
        case ParameterType.Player:
            return entry.type === VariableType.Player;
        case ParameterType.Object:
            return entry.type === VariableType.Object || entry.type === VariableType.Player;
        default:
            return false;
    }
};

const lookupNumericSymbol = (ctx: ParserContext, name: string): number | undefined => {
    const symbolId = ctx.symbolParser.lookupSymbol(name);
    if (symbolId === undefined) {
        return undefined;
    }

    const entry = ctx.symbolParser.getSymbolEntry(symbolId);
    if (
        entry === undefined
        || (
            entry.kind !== SymbolKind.Constant
            && entry.kind !== SymbolKind.GameOption
            && !(entry.kind === SymbolKind.Variable && entry.type === VariableType.Number)
        )
    ) {
        return undefined;
    }

    return symbolId;
};

export const parseIfOperand = (
    ctx: ParserContext,
    anchor: SourceCodeLocation,
): ASTConditionOperandNode => {
    const token = ctx.peekToken();
    if (token?.kind === TokenKind.Integer) {
        const integerToken = ctx.getToken();
        return {
            kind: SyntaxKind.INTEGER,
            value: Number.parseInt(integerToken.value, 10),
            location: integerToken.location,
        };
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

    const rootToken = ctx.getToken();
    const symbolId = lookupNumericSymbol(ctx, rootToken.value)
        ?? ctx.symbolParser.lookupSymbol(rootToken.value);

    if (ctx.peekToken()?.kind === TokenKind.MemberVariableSeparator) {
        return parseMemberReference(ctx, rootToken);
    }

    if (symbolId !== undefined) {
        const referenceNode: ASTReferenceNode = {
            kind: SyntaxKind.REFERENCE,
            identifier: rootToken.value,
            location: rootToken.location,
        };
        return referenceNode;
    }

    return {
        kind: SyntaxKind.KEYWORD,
        value: rootToken.value,
        location: rootToken.location,
    };
};

export const parseTypedOperand = (
    ctx: ParserContext,
    anchor: SourceCodeLocation,
    type: ParameterType,
): ASTConditionOperandNode => {
    const token = ctx.peekToken();

    if (type === ParameterType.Number && token?.kind === TokenKind.Integer) {
        const integerToken = ctx.getToken();
        return {
            kind: SyntaxKind.INTEGER,
            value: Number.parseInt(integerToken.value, 10),
            location: integerToken.location,
        };
    }

    if (token?.kind !== TokenKind.Identifier) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedParameterType(parameterTypeLabel(type), token?.value ?? ""),
            token?.location ?? anchor,
        );
        return {
            kind: SyntaxKind.INVALID,
            location: anchor,
        };
    }

    const rootToken = ctx.getToken();
    const symbolId = ctx.symbolParser.lookupSymbol(rootToken.value);

    if (ctx.peekToken()?.kind === TokenKind.MemberVariableSeparator) {
        return parseMemberReference(ctx, rootToken);
    }

    if (symbolId === undefined || !matchesVariableType(ctx, symbolId, type)) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedParameterType(parameterTypeLabel(type), rootToken.value),
            rootToken.location,
        );
        return {
            kind: SyntaxKind.INVALID,
            location: rootToken.location,
        };
    }

    const referenceNode: ASTReferenceNode = {
        kind: SyntaxKind.REFERENCE,
        identifier: rootToken.value,
        location: rootToken.location,
    };
    return referenceNode;
};

export const parseKeywordOperand = (
    ctx: ParserContext,
    anchor: SourceCodeLocation,
    allowed?: readonly string[],
): ASTConditionOperandNode => {
    const token = ctx.peekToken();
    if (token?.kind !== TokenKind.Identifier) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedParameterType("keyword", token?.value ?? ""),
            token?.location ?? anchor,
        );
        return {
            kind: SyntaxKind.INVALID,
            location: anchor,
        };
    }

    const keywordToken = ctx.getToken();
    if (allowed !== undefined && !allowed.includes(keywordToken.value)) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedParameterType(allowed.map((value) => `'${value}'`).join(" | "), keywordToken.value),
            keywordToken.location,
        );
    }

    return {
        kind: SyntaxKind.KEYWORD,
        value: keywordToken.value,
        location: keywordToken.location,
    };
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
