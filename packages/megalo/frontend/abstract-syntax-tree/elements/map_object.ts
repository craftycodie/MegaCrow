import { ASTElementBase, ElementKind } from ".";
import { ASTErrorNode, ASTNode, SyntaxKind } from "..";
import { SourceCodeLocation, SourceLocationType } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { Token, TokenKind } from "../../tokens";
import { ParserContext } from "../context";
import { isEndToken, locationSpan, parseIdentifier } from "./game_options/shared";
import { isAstErrorNode } from "../kinds";

type MapObjectFilterNameNode = { value: string; location: SourceCodeLocation };

type MapObjectPropertyValueNode =
    | (ASTNode<SyntaxKind.QUOTED_STRING> & { value: string })
    | ASTErrorNode;

export type MapObjectPropertyNode = {
    key: string;
    value: MapObjectPropertyValueNode;
    location: SourceCodeLocation;
};

export type MapObjectElementNode = ASTElementBase<ElementKind.MAP_OBJECT> & {
    filterName: MapObjectFilterNameNode | ASTErrorNode;
    properties: MapObjectPropertyNode[];
};

const parseFilterName = (
    ctx: ParserContext,
    elementToken: Token,
): MapObjectElementNode["filterName"] => {
    const next = ctx.peekToken();
    if (
        !next ||
        next.kind !== TokenKind.Identifier ||
        next.location.start.line !== elementToken.location.start.line
    ) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedTokenKind(TokenKind.Identifier, next?.kind ?? TokenKind.None, next?.value ?? ""),
            elementToken.location,
        );
        return {
            kind: SyntaxKind.INVALID,
            location: elementToken.location,
        };
    }

    const filterName = parseIdentifier(ctx, elementToken);
    if (isAstErrorNode(filterName)) {
        return filterName;
    }

    return {
        value: filterName.value,
        location: filterName.location,
    };
};

const parseQuotedStringValue = (
    ctx: ParserContext,
    anchor: Token,
): MapObjectPropertyValueNode => {
    const token = ctx.getToken();
    if (token.kind === TokenKind.QuotedString) {
        return {
            kind: SyntaxKind.QUOTED_STRING,
            value: token.value,
            location: token.location,
        };
    }

    ctx.diagnostics.addError(
        diagnosticMessages.expectedTokenKind(TokenKind.QuotedString, token.kind, token.value),
        token.location,
    );
    return {
        kind: SyntaxKind.INVALID,
        location: anchor.location,
    };
};

export const mapObjectParser = (
    ctx: ParserContext,
    elementToken: Token,
): MapObjectElementNode => {
    const filterName = parseFilterName(ctx, elementToken);
    const properties: MapObjectPropertyNode[] = [];

    while (ctx.hasMore()) {
        const token = ctx.peekToken();
        if (!token) {
            break;
        }

        if (isEndToken(token)) {
            const endToken = ctx.getToken();
            return {
                kind: SyntaxKind.ELEMENT,
                elementKind: ElementKind.MAP_OBJECT,
                filterName,
                properties,
                location: locationSpan(elementToken.location, endToken.location),
            };
        }

        const key = parseIdentifier(ctx, elementToken);
        if (isAstErrorNode(key)) {
            parseQuotedStringValue(ctx, elementToken);
            continue;
        }

        const value = parseQuotedStringValue(ctx, elementToken);
        properties.push({
            key: key.value,
            value,
            location: {
                type: SourceLocationType.SOURCE_CODE,
                start: key.location.start,
                end: value.location.end,
            },
        });
    }

    ctx.diagnostics.addError(diagnosticMessages.expectedEndBeforeEof(), elementToken.location);
    return {
        kind: SyntaxKind.ELEMENT,
        elementKind: ElementKind.MAP_OBJECT,
        filterName,
        properties,
        location: elementToken.location,
    };
};
