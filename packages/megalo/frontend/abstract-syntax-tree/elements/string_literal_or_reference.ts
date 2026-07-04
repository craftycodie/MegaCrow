import { ASTErrorNode, ASTNode, ASTReferenceNode, SyntaxKind } from "..";
import { SourceCodeLocation } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { Token, TokenKind } from "../../tokens";
import { ParserContext } from "../context";

export type ASTStringLiteralOrReference =
    | (ASTNode<SyntaxKind.QUOTED_STRING> & { value: string })
    | ASTReferenceNode
    | ASTErrorNode;

const isMissingToken = (token: Token | undefined): boolean =>
    !token || (token.kind === TokenKind.Identifier && token.value === "end");

export const parseStringLiteralOrReference = (
    ctx: ParserContext,
    anchor: Token,
): ASTStringLiteralOrReference => {
    const peek = ctx.peekToken();
    if (isMissingToken(peek)) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedTokenKind(
                TokenKind.QuotedString,
                peek?.kind ?? TokenKind.None,
                peek?.value ?? "",
            ),
            anchor.location,
        );
        return {
            kind: SyntaxKind.INVALID,
            location: anchor.location,
        };
    }

    const token = ctx.getToken();
    if (token.kind === TokenKind.QuotedString) {
        return {
            kind: SyntaxKind.QUOTED_STRING,
            value: token.value,
            location: token.location,
        };
    }

    if (token.kind === TokenKind.Identifier) {
        const symbolId = ctx.symbolParser.addStringReference(token.value, token.location);
        if (symbolId !== undefined) {
            return {
                kind: SyntaxKind.REFERENCE,
                identifier: token.value,
                symbolId,
                location: token.location,
            };
        }

        ctx.diagnostics.addError(
            diagnosticMessages.invalidStringIdentifier(token.value),
            token.location,
        );
        return {
            kind: SyntaxKind.INVALID,
            location: token.location,
        };
    }

    ctx.diagnostics.addError(
        diagnosticMessages.expectedTokenKind(TokenKind.QuotedString, token.kind, token.value),
        token.location,
    );
    return {
        kind: SyntaxKind.INVALID,
        location: token.location,
    };
};

export const stringLiteralOrReferenceLocation = (node: ASTStringLiteralOrReference): SourceCodeLocation =>
    node.location;
