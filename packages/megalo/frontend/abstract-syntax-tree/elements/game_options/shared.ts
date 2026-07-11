import { ASTErrorNode, ASTReferenceNode, SyntaxKind } from "../..";
import { SourceCodeLocation, SourceLocationType } from "../../../diagnostics";
import { diagnosticMessages } from "../../../diagnostics/messages";
import { Token, TokenKind } from "../../../tokens";
import { ParserContext } from "../../context";

export const isEndToken = (token: Token | undefined): boolean =>
    token?.kind === TokenKind.Identifier && token.value === "end";

export const locationSpan = (start: SourceCodeLocation, end: SourceCodeLocation): SourceCodeLocation => ({
    type: SourceLocationType.SOURCE_CODE,
    start: start.start,
    end: end.end,
});

export const parseIdentifier = (
    ctx: ParserContext,
    anchor: Token,
): { value: string; location: SourceCodeLocation } | ASTErrorNode => {
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

export const parseGameOptionReference = (ctx: ParserContext, nameToken: Token): ASTReferenceNode | ASTErrorNode => {
    if (nameToken.kind !== TokenKind.Identifier) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedTokenKind(TokenKind.Identifier, nameToken.kind, nameToken.value),
            nameToken.location,
        );
        return {
            kind: SyntaxKind.INVALID,
            location: nameToken.location,
        };
    }

    const symbolId = ctx.symbolParser.lookupSymbol(nameToken.value);
    if (symbolId === undefined) {
        return {
            kind: SyntaxKind.INVALID,
            location: nameToken.location,
        };
    }

    return {
        kind: SyntaxKind.REFERENCE,
        identifier: nameToken.value,
        location: nameToken.location,
    };
};
