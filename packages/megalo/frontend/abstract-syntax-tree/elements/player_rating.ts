import { ASTElementBase, ElementKind } from ".";
import { ASTErrorNode, ASTFloatingPointNode, ASTIntegerNode, ASTReferenceNode, SyntaxKind } from "..";
import { SourceCodeLocation } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { Token, TokenKind } from "../../tokens";
import { ParserContext } from "../context";
import { isEndToken, locationSpan, parseIdentifier } from "./game_options/shared";
import { isAstErrorNode } from "../kinds";

export type PlayerRatingValueNode =
    | ASTIntegerNode
    | ASTFloatingPointNode
    | ASTReferenceNode
    | ASTErrorNode;

export type PlayerRatingFieldNode = {
    key: string;
    value: PlayerRatingValueNode;
};

export type PlayerRatingElementNode = ASTElementBase<ElementKind.PLAYER_RATING> & {
    fields: PlayerRatingFieldNode[];
};

const isMissingValue = (token: Token | undefined): boolean =>
    !token || (token.kind === TokenKind.Identifier && token.value === "end");

const parsePlayerRatingValue = (
    ctx: ParserContext,
    anchor: SourceCodeLocation,
): PlayerRatingValueNode => {
    const valuePeek = ctx.peekToken();
    if (isMissingValue(valuePeek)) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedConstantValue(valuePeek?.value ?? ""),
            anchor,
        );
        return {
            kind: SyntaxKind.INVALID,
            location: anchor,
        };
    }

    const valueToken = ctx.getToken();
    if (valueToken.kind === TokenKind.Integer) {
        return {
            kind: SyntaxKind.INTEGER,
            location: valueToken.location,
            value: Number.parseInt(valueToken.value, 10),
        };
    }

    if (valueToken.kind === TokenKind.FloatingPoint) {
        return {
            kind: SyntaxKind.FLOATING_POINT,
            location: valueToken.location,
            value: Number.parseFloat(valueToken.value),
        };
    }

    if (valueToken.kind === TokenKind.Identifier) {
        const symbolId = ctx.symbolParser.lookupSymbol(valueToken.value);
        if (symbolId === undefined) {
            ctx.diagnostics.addError(
                diagnosticMessages.expectedConstantValue(valueToken.value),
                valueToken.location,
            );
            return {
                kind: SyntaxKind.INVALID,
                location: valueToken.location,
            };
        }

        return {
            kind: SyntaxKind.REFERENCE,
            location: valueToken.location,
            identifier: valueToken.value,
        };
    }

    ctx.diagnostics.addError(
        diagnosticMessages.expectedConstantValue(valueToken.value),
        valueToken.location,
    );
    return {
        kind: SyntaxKind.INVALID,
        location: valueToken.location,
    };
};

export const playerRatingParser = (
    ctx: ParserContext,
    elementToken: Token,
): PlayerRatingElementNode => {
    const fields: PlayerRatingFieldNode[] = [];

    while (ctx.hasMore()) {
        const token = ctx.peekToken();
        if (!token) {
            break;
        }

        if (isEndToken(token)) {
            const endToken = ctx.getToken();
            return {
                kind: SyntaxKind.ELEMENT,
                elementKind: ElementKind.PLAYER_RATING,
                keywordLocation: elementToken.location,
                fields,
                location: locationSpan(elementToken.location, endToken.location),
            };
        }

        const key = parseIdentifier(ctx, elementToken);

        if (isAstErrorNode(key)) {
            continue;
        }

        fields.push({
            key: key.value,
            value: parsePlayerRatingValue(ctx, key.location),
        });
    }

    ctx.diagnostics.addError(diagnosticMessages.expectedEndBeforeEof(), elementToken.location);
    return {
        kind: SyntaxKind.ELEMENT,
        elementKind: ElementKind.PLAYER_RATING,
        keywordLocation: elementToken.location,
        fields,
        location: elementToken.location,
    };
};
