import { ASTElementBase, ElementKind } from ".";
import { ASTErrorNode, ASTIntegerNode, ASTReferenceNode, SyntaxKind } from "..";
import { SourceCodeLocation, SourceLocationType } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { Token, TokenKind } from "../../tokens";
import { ParserContext } from "../context";
import { ASTKeywordParameterNode } from "../parameters";
import { ObjectListType } from "../../object-lists";
import { isEndToken, locationSpan, parseIdentifier } from "./game_options/shared";
import { isAstErrorNode } from "../kinds";
import {
    ASTStringLiteralOrReference,
    parseStringLiteralOrReference,
} from "../parameters/string_literal_or_reference";
import {
    isMapObjectPropertyKey,
    MAP_OBJECT_PROPERTY_KEYS,
    MapObjectPropertyKey,
} from "../../language-configuration/omni/map_object";

type MapObjectFilterNameNode = { value: string; location: SourceCodeLocation };

export type MapObjectPropertyValueNode =
    | ASTStringLiteralOrReference
    | ASTKeywordParameterNode
    | ASTIntegerNode;

export type MapObjectPropertyNode = {
    key: MapObjectPropertyKey;
    value: MapObjectPropertyValueNode;
    location: SourceCodeLocation;
};

export type MapObjectElementNode = ASTElementBase<ElementKind.MAP_OBJECT> & {
    filterName: MapObjectFilterNameNode | ASTErrorNode;
    properties: MapObjectPropertyNode[];
};

const consumeValueTokenIfPresent = (ctx: ParserContext): void => {
    const next = ctx.peekToken();
    if (next && !(next.kind === TokenKind.Identifier && next.value === "end")) {
        ctx.getToken();
    }
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

const parseTypePropertyValue = (
    ctx: ParserContext,
    anchor: Token,
): ASTReferenceNode | ASTErrorNode => {
    const token = ctx.getToken();
    // In this instance, the ObjectList is referenced with a quoted string.
    // Megalo is inconsistent with this.
    if (token.kind !== TokenKind.QuotedString) {
        ctx.diagnostics.addError(
            // TODO: make a custom diagnostic message for this
            // We should explain that quotes are needed.
            diagnosticMessages.expectedTokenKind(TokenKind.QuotedString, token.kind, token.value),
            token.location,
        );
        return {
            kind: SyntaxKind.INVALID,
            location: anchor.location,
        };
    }

    const symbolId = ctx.symbolParser.lookupObjectListItem(ObjectListType.Objects, token.value);
    if (symbolId === undefined) {
        ctx.diagnostics.addError(diagnosticMessages.invalidObjectType(), token.location);
        return {
            kind: SyntaxKind.INVALID,
            location: token.location,
        };
    }

    ctx.symbolParser.recordReference(symbolId, token.location);
    return {
        kind: SyntaxKind.REFERENCE,
        identifier: token.value,
        symbolId,
        location: token.location,
    };
};

const parseTeamPropertyValue = (
    ctx: ParserContext,
    anchor: Token,
): ASTKeywordParameterNode | ASTErrorNode => {
    const token = ctx.getToken();
    if (token.kind === TokenKind.Identifier) {
        return {
            kind: SyntaxKind.KEYWORD,
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

const parseIntegerPropertyValue = (
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
        diagnosticMessages.expectedTokenKind(TokenKind.Integer, token.kind, token.value),
        token.location,
    );
    return {
        kind: SyntaxKind.INVALID,
        location: anchor.location,
    };
};

const parsePropertyValue = (
    ctx: ParserContext,
    anchor: Token,
    key: MapObjectPropertyKey,
): MapObjectPropertyValueNode => {
    switch (key) {
        case "label":
            return parseStringLiteralOrReference(ctx, anchor);
        case "type":
            return parseTypePropertyValue(ctx, anchor);
        case "team":
            return parseTeamPropertyValue(ctx, anchor);
        case "user_data":
        case "min":
            return parseIntegerPropertyValue(ctx, anchor);
        default:
            return {
                kind: SyntaxKind.INVALID,
                location: anchor.location,
            };
    }
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
                keywordLocation: elementToken.location,
                filterName,
                properties,
                location: locationSpan(elementToken.location, endToken.location),
            };
        }

        const key = parseIdentifier(ctx, elementToken);
        if (isAstErrorNode(key)) {
            consumeValueTokenIfPresent(ctx);
            continue;
        }

        if (!isMapObjectPropertyKey(key.value)) {
            // MegaloEdit.exe: Expected 'label', 'type', 'user_data', 'team', 'min', or 'end'
            ctx.diagnostics.addError(
                diagnosticMessages.expectedOneOf(
                    [...MAP_OBJECT_PROPERTY_KEYS, "end"],
                    key.value,
                ),
                key.location,
            );
            consumeValueTokenIfPresent(ctx);
            continue;
        }

        const value = parsePropertyValue(ctx, elementToken, key.value);
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
        keywordLocation: elementToken.location,
        filterName,
        properties,
        location: elementToken.location,
    };
};
