import { ASTElementBase, ElementKind } from ".";
import { ASTErrorNode, ASTIntegerNode, ASTNode, ASTReferenceNode, SyntaxKind } from "..";
import { ASTKeywordParameterNode } from "../parameters";
import { SourceCodeLocation, SourceLocationType } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { Token, TokenKind } from "../../tokens";
import { ParserContext } from "../context";
import { isEndToken, locationSpan } from "./game_options/shared";
import { isAstErrorNode } from "../kinds";
import { ASTStringLiteralOrReference, parseStringLiteralOrReference } from "../parameters/string_literal_or_reference";

const GAME_STAT_FORMAT_KINDS = new Set(["number", "timer", "delta", "percentage"]);

type GameStatEntryNodeName = { value: string; location: SourceCodeLocation };
type GameStatEntryNodeType = { value: string; location: SourceCodeLocation };

export type GameStatUnitStringNode =
    | (ASTNode<SyntaxKind.QUOTED_STRING> & { value: string })
    | ASTReferenceNode
    | ASTKeywordParameterNode
    | ASTErrorNode;

export type GameStatEntryNode = {
    name: GameStatEntryNodeName | ASTErrorNode;
    type: GameStatEntryNodeType | ASTErrorNode;
    labelString: ASTStringLiteralOrReference;
    unitString: GameStatUnitStringNode;
    flags: ASTIntegerNode | ASTErrorNode;
    location: SourceCodeLocation;
};

export type GameStatsElementNode = ASTElementBase<ElementKind.GAME_STATS> & {
    entries: GameStatEntryNode[];
};

const parseIdentifierField = (
    ctx: ParserContext,
    anchor: Token,
): GameStatEntryNodeName | ASTErrorNode => {
    const token = ctx.getToken();
    if (token.kind === TokenKind.Identifier) {
        return {
            value: token.value,
            location: token.location,
        };
    }

    ctx.diagnostics.addError(
        diagnosticMessages.expectedTokenKind(TokenKind.Identifier, token.kind, token.value),
        token.location,
    );
    return {
        kind: SyntaxKind.INVALID,
        location: anchor.location,
    };
};

const parseStatFormat = (
    ctx: ParserContext,
    anchor: Token,
): GameStatEntryNodeType | ASTErrorNode => {
    const token = ctx.getToken();
    if (token.kind !== TokenKind.Identifier) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedParameterType(
                "statistic format (number, timer, delta, percentage)",
                token.value,
            ),
            token.location,
        );
        return {
            kind: SyntaxKind.INVALID,
            location: anchor.location,
        };
    }

    if (!GAME_STAT_FORMAT_KINDS.has(token.value)) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedParameterType(
                "statistic format (number, timer, delta, percentage)",
                token.value,
            ),
            token.location,
        );
        return {
            kind: SyntaxKind.INVALID,
            location: token.location,
        };
    }

    return {
        value: token.value,
        location: token.location,
    };
};

const parseUnitString = (
    ctx: ParserContext,
    anchor: Token,
): GameStatUnitStringNode => {
    const token = ctx.peekToken();
    if (!token || (token.kind === TokenKind.Identifier && token.value === "end")) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedParameterType("string literal, string reference, or 'none'", token?.value ?? ""),
            token?.location ?? anchor.location,
        );
        return {
            kind: SyntaxKind.INVALID,
            location: anchor.location,
        };
    }

    const unitToken = ctx.getToken();
    if (unitToken.kind === TokenKind.QuotedString) {
        return {
            kind: SyntaxKind.QUOTED_STRING,
            value: unitToken.value,
            location: unitToken.location,
        };
    }

    if (unitToken.kind === TokenKind.Identifier) {
        if (unitToken.value === "none") {
            return {
                kind: SyntaxKind.KEYWORD,
                value: unitToken.value,
                location: unitToken.location,
            };
        }

        const symbolId = ctx.symbolParser.lookupString(unitToken.value);
        if (symbolId === undefined) {
            ctx.diagnostics.addError(
                diagnosticMessages.invalidStringIdentifier(unitToken.value),
                unitToken.location,
            );
            return {
                kind: SyntaxKind.INVALID,
                location: unitToken.location,
            };
        }

        return {
            kind: SyntaxKind.REFERENCE,
            identifier: unitToken.value,
            location: unitToken.location,
        };
    }

    ctx.diagnostics.addError(
        diagnosticMessages.expectedParameterType("string literal, string reference, or 'none'", unitToken.value),
        unitToken.location,
    );
    return {
        kind: SyntaxKind.INVALID,
        location: anchor.location,
    };
};

const parseFlags = (
    ctx: ParserContext,
    anchor: Token,
): ASTIntegerNode | ASTErrorNode => {
    const token = ctx.getToken();
    if (token.kind === TokenKind.Integer) {
        return {
            kind: SyntaxKind.INTEGER,
            value: Number.parseInt(token.value, 10),
            location: token.location,
        };
    }

    ctx.diagnostics.addError(
        diagnosticMessages.expectedParameterType("number", token.value),
        token.location,
    );
    return {
        kind: SyntaxKind.INVALID,
        location: anchor.location,
    };
};

const parseGameStatEntry = (ctx: ParserContext): GameStatEntryNode => {
    const anchor = ctx.peekToken()!;
    const name = parseIdentifierField(ctx, anchor);
    const nameLocation = isAstErrorNode(name) ? anchor.location : name.location;

    const type = parseStatFormat(ctx, anchor);
    const labelString = parseStringLiteralOrReference(ctx, anchor);
    const unitString = parseUnitString(ctx, anchor);
    const flags = parseFlags(ctx, anchor);

    return {
        name,
        type,
        labelString,
        unitString,
        flags,
        location: {
            type: SourceLocationType.SOURCE_CODE,
            start: nameLocation.start,
            end: flags.location.end,
        },
    };
};

export const gameStatsParser = (
    ctx: ParserContext,
    elementToken: Token,
): GameStatsElementNode => {
    const entries: GameStatEntryNode[] = [];

    while (ctx.hasMore()) {
        const token = ctx.peekToken();
        if (!token) {
            break;
        }

        if (isEndToken(token)) {
            const endToken = ctx.getToken();
            return {
                kind: SyntaxKind.ELEMENT,
                elementKind: ElementKind.GAME_STATS,
                keywordLocation: elementToken.location,
                entries,
                location: locationSpan(elementToken.location, endToken.location),
            };
        }

        entries.push(parseGameStatEntry(ctx));
    }

    ctx.diagnostics.addError(diagnosticMessages.expectedEndBeforeEof(), elementToken.location);
    return {
        kind: SyntaxKind.ELEMENT,
        elementKind: ElementKind.GAME_STATS,
        keywordLocation: elementToken.location,
        entries,
        location: elementToken.location,
    };
};
