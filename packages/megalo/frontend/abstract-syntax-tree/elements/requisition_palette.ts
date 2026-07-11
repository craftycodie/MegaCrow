import { ASTElementBase, ElementKind } from ".";
import { ASTErrorNode, ASTNode, SyntaxKind } from "..";
import { ASTKeywordParameterNode } from "../parameters";
import { SourceCodeLocation, SourceLocationType } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { Token, TokenKind } from "../../tokens";
import { ParserContext } from "../context";
import { isEndToken, locationSpan, parseIdentifier } from "./game_options/shared";
import { isAstErrorNode } from "../kinds";

type RequisitionPaletteIdentifierNode = { value: string; location: SourceCodeLocation };

type RequisitionPaletteNameNode = RequisitionPaletteIdentifierNode | ASTErrorNode;

type RequisitionPaletteItemNameNode =
    | (ASTNode<SyntaxKind.QUOTED_STRING> & { value: string })
    | ASTErrorNode;

export type RequisitionPaletteBaselineNode = RequisitionPaletteIdentifierNode | ASTErrorNode;

export type RequisitionPaletteItemStateNode = ASTKeywordParameterNode | ASTErrorNode;

export type RequisitionPaletteItemNode = {
    name: RequisitionPaletteItemNameNode;
    state: RequisitionPaletteItemStateNode;
    location: SourceCodeLocation;
};

export type RequisitionPaletteElementNode = ASTElementBase<ElementKind.REQUISITION_PALETTE> & {
    name: RequisitionPaletteNameNode;
    baseline?: RequisitionPaletteBaselineNode;
    items: RequisitionPaletteItemNode[];
};

const parsePaletteName = (
    ctx: ParserContext,
    elementToken: Token,
): RequisitionPaletteElementNode["name"] => {
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

    const name = parseIdentifier(ctx, elementToken);
    if (isAstErrorNode(name)) {
        return name;
    }

    ctx.symbolParser.addRequisitionPaletteToScope(name.value, name.location);
    return {
        value: name.value,
        location: name.location,
    };
};

const parseQuotedStringValue = (
    ctx: ParserContext,
    anchor: Token,
): RequisitionPaletteItemNameNode => {
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

const parseItemState = (
    ctx: ParserContext,
    anchor: Token,
): RequisitionPaletteItemStateNode => {
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

const parseBaseline = (
    ctx: ParserContext,
    elementToken: Token,
    baselineKeyword: { value: string; location: SourceCodeLocation },
): RequisitionPaletteBaselineNode => {
    const value = parseIdentifier(ctx, elementToken);
    if (isAstErrorNode(value)) {
        return value;
    }

    return {
        value: value.value,
        location: {
            type: SourceLocationType.SOURCE_CODE,
            start: baselineKeyword.location.start,
            end: value.location.end,
        },
    };
};

const parseItem = (
    ctx: ParserContext,
    elementToken: Token,
    itemKeyword: { value: string; location: SourceCodeLocation },
): RequisitionPaletteItemNode => {
    const name = parseQuotedStringValue(ctx, elementToken);
    const state = parseItemState(ctx, elementToken);

    return {
        name,
        state,
        location: {
            type: SourceLocationType.SOURCE_CODE,
            start: itemKeyword.location.start,
            end: state.location.end,
        },
    };
};

export const requisitionPaletteParser = (
    ctx: ParserContext,
    elementToken: Token,
): RequisitionPaletteElementNode => {
    const name = parsePaletteName(ctx, elementToken);
    let baseline: RequisitionPaletteBaselineNode | undefined;
    const items: RequisitionPaletteItemNode[] = [];

    while (ctx.hasMore()) {
        const token = ctx.peekToken();
        if (!token) {
            break;
        }

        if (isEndToken(token)) {
            const endToken = ctx.getToken();
            return {
                kind: SyntaxKind.ELEMENT,
                elementKind: ElementKind.REQUISITION_PALETTE,
                keywordLocation: elementToken.location,
                name,
                baseline,
                items,
                location: locationSpan(elementToken.location, endToken.location),
            };
        }

        const keyword = parseIdentifier(ctx, elementToken);
        if (isAstErrorNode(keyword)) {
            continue;
        }

        if (keyword.value === "baseline") {
            baseline = parseBaseline(ctx, elementToken, keyword);
            continue;
        }

        if (keyword.value === "item") {
            items.push(parseItem(ctx, elementToken, keyword));
            continue;
        }

        ctx.diagnostics.addError(
            diagnosticMessages.expectedParameterType("baseline, item, or end", keyword.value),
            keyword.location,
        );
    }

    ctx.diagnostics.addError(diagnosticMessages.expectedEndBeforeEof(), elementToken.location);
    return {
        kind: SyntaxKind.ELEMENT,
        elementKind: ElementKind.REQUISITION_PALETTE,
        keywordLocation: elementToken.location,
        name,
        baseline,
        items,
        location: elementToken.location,
    };
};
