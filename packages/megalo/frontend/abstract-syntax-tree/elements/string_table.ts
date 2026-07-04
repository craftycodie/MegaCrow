import { ASTElementBase, ElementKind } from ".";
import { ASTErrorNode, ASTNode, SyntaxKind } from "..";
import { SourceLocation } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { Token, TokenKind } from "../../tokens";
import { ParserContext } from "../context";

type StringTableEntryNodeSymbol = { value: string; location: SourceLocation };
type StringTableEntryNodeValue = ASTNode<SyntaxKind.QUOTED_STRING> & { value: string };

export type StringTableEntryNode = {
    symbol: StringTableEntryNodeSymbol | ASTErrorNode;
    value: StringTableEntryNodeValue | ASTErrorNode;
    location: SourceLocation;
};

export type StringTableElementNode = ASTElementBase<ElementKind.STRING_TABLE> & {
    language: { value: string; location: SourceLocation };
    entries: StringTableEntryNode[];
};

const parseLanguage = (
    ctx: ParserContext,
    elementToken: Token,
): StringTableElementNode["language"] => {
    const next = ctx.peekToken();
    if (
        !next ||
        next.kind !== TokenKind.Identifier ||
        next.location.start.line !== elementToken.location.start.line
    ) {
        return {
            value: "",
            location: elementToken.location,
        };
    }

    const langToken = ctx.getToken();
    if (langToken.kind !== TokenKind.Identifier) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedTokenKind(TokenKind.Identifier, langToken.kind, langToken.value),
            langToken.location,
        );
    }

    return {
        value: langToken.value,
        location: langToken.location,
    };
};

export const stringTableParser = (ctx: ParserContext, elementToken: Token): StringTableElementNode => {
    const language = parseLanguage(ctx, elementToken);
    const entries: StringTableEntryNode[] = [];

    ctx.parseUntilEnd(() => {
        const token = ctx.peekToken();
        if (!token) {
            return;
        }
        if (token.kind === TokenKind.Comment) {
            ctx.getToken();
            return;
        }

        const symbolToken = ctx.getToken();
        let symbol: StringTableEntryNode["symbol"];
        if (symbolToken.kind === TokenKind.Identifier) {
            symbol = {
                value: symbolToken.value,
                location: symbolToken.location,
            };

            ctx.addStringToScope({
                name: symbolToken.value,
                declaration: symbolToken.location,
                language: language.value,
            });
        } else {
            ctx.diagnostics.addError(
                diagnosticMessages.expectedTokenKind(TokenKind.Identifier, symbolToken.kind, symbolToken.value),
                symbolToken.location,
            );
            symbol = {
                kind: SyntaxKind.INVALID,
                location: symbolToken.location,
            };
        }

        const valueToken = ctx.getToken();
        let value: StringTableEntryNode["value"];
        if (valueToken.kind === TokenKind.QuotedString) {
            value = {
                kind: SyntaxKind.QUOTED_STRING,
                location: valueToken.location,
                value: valueToken.value,
            };
        } else {
            ctx.diagnostics.addError(
                diagnosticMessages.expectedTokenKind(TokenKind.QuotedString, valueToken.kind, valueToken.value),
                valueToken.location,
            );
            value = {
                kind: SyntaxKind.INVALID,
                location: valueToken.location,
            };
        }

        entries.push({
            symbol,
            value,
            location: {
                start: symbolToken.location.start,
                end: valueToken.location.end,
            },
        });
    });

    return {
        kind: SyntaxKind.ELEMENT,
        elementKind: ElementKind.STRING_TABLE,
        location: elementToken.location,
        language,
        entries,
    };
};
