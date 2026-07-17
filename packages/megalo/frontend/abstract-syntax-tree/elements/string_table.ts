import { ASTElementBase, ElementKind } from ".";
import { ASTErrorNode, ASTNode, SyntaxKind } from "..";
import { SourceCodeLocation, SourceLocationType } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { Token, TokenKind } from "../../tokens";
import { ParserContext } from "../context";
import { ParameterType, tryParseParameterValue } from "../parameters";
import { locationSpan } from "./game_options/shared";

type StringTableEntryNodeSymbol = { value: string; location: SourceCodeLocation };
type StringTableEntryNodeValue = ASTNode<SyntaxKind.QUOTED_STRING> & { value: string };

export type StringTableEntryNode = {
    symbol: StringTableEntryNodeSymbol | ASTErrorNode;
    value: StringTableEntryNodeValue | ASTErrorNode;
    location: SourceCodeLocation;
};

export type StringTableElementNode = ASTElementBase<ElementKind.STRING_TABLE> & {
    language: { value: string; location: SourceCodeLocation };
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

        const quoted = tryParseParameterValue(ctx, ParameterType.QuotedString);
        let value: StringTableEntryNode["value"];
        let valueLocation: SourceCodeLocation;
        let content = "";

        if (quoted !== undefined && quoted.kind === SyntaxKind.QUOTED_STRING) {
            value = quoted;
            valueLocation = quoted.location;
            content = quoted.value;
        } else {
            const valueToken = ctx.getToken();
            ctx.diagnostics.addError(
                diagnosticMessages.expectedTokenKind(TokenKind.QuotedString, valueToken.kind, valueToken.value),
                valueToken.location,
            );
            value = {
                kind: SyntaxKind.INVALID,
                location: valueToken.location,
            };
            valueLocation = valueToken.location;
        }

        if (symbolToken.kind === TokenKind.Identifier) {
            ctx.symbolParser.addStringToScope({
                name: symbolToken.value,
                declaration: symbolToken.location,
                language: language.value,
                content,
            });
        }

        entries.push({
            symbol,
            value,
            location: {
                type: SourceLocationType.SOURCE_CODE,
                start: symbolToken.location.start,
                end: valueLocation.end,
            },
        });
    });

    const endToken = ctx.peekToken(-1);
    const endLocation = endToken?.location ?? entries.at(-1)?.location ?? elementToken.location;

    return {
        kind: SyntaxKind.ELEMENT,
        elementKind: ElementKind.STRING_TABLE,
        keywordLocation: elementToken.location,
        location: locationSpan(elementToken.location, endLocation),
        language,
        entries,
    };
};
