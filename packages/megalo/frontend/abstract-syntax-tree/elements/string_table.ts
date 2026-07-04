import { ASTElementBase, ElementKind } from ".";
import { ASTErrorNode, ASTNode, SyntaxKind } from "..";
import { SourceLocation } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { Token, TokenKind } from "../../tokens";
import { ParserContext } from "../context";

const DEFAULT_LANGUAGE = "default";

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

export const stringTableParser = (ctx: ParserContext, elementToken: Token): StringTableElementNode => {
    let language: StringTableElementNode["language"] = {
        value: DEFAULT_LANGUAGE,
        location: elementToken.location,
    };

    const next = ctx.peekToken();
    if (
        next &&
        next.kind === TokenKind.Identifier &&
        next.value !== "end" &&
        next.location.start.line === elementToken.location.start.line
    ) {
        const langToken = ctx.getToken();
        if (langToken.kind === TokenKind.Identifier) {
            language = {
                value: langToken.value,
                location: langToken.location,
            };
        } else {
            ctx.diagnostics.addError(
                diagnosticMessages.expectedTokenKind(TokenKind.Identifier, langToken.kind, langToken.value),
                langToken.location,
            );
        }
    }

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
