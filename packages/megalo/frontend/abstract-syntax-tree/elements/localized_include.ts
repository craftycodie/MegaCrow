import { ASTElementBase, ASTElementNode, ElementKind } from ".";
import { ASTErrorNode, ASTNode, SyntaxKind } from "..";
import { diagnosticMessages } from "../../diagnostics/messages";
import { Token, TokenKind } from "../../tokens";
import { ParserContext } from "../context";

type LocalizedIncludeElementNodeFile = ASTNode<SyntaxKind.QUOTED_STRING> & { value: string };

export type LocalizedIncludeElementNode = ASTElementBase<ElementKind.LOCALIZED_INCLUDE> & {
    file: LocalizedIncludeElementNodeFile | ASTErrorNode;
}

export const localizedIncludeParser = (ctx: ParserContext, elementToken: Token): LocalizedIncludeElementNode => {
    const pathToken = ctx.getToken();
    let file: LocalizedIncludeElementNode["file"];

    if (pathToken.kind !== TokenKind.QuotedString) {
        // MegaloEdit.exe: Expected token of type QuotedString, got one of type <type>: <token>
        ctx.diagnostics?.addError(
            diagnosticMessages.expectedTokenKind(TokenKind.QuotedString, pathToken.kind, pathToken.value),
            pathToken.location,
        );
        file = {
            kind: SyntaxKind.INVALID,
            location: pathToken.location,
        };
    } else {
        file = {
            kind: SyntaxKind.QUOTED_STRING,
            location: pathToken.location,
            value: pathToken.value,
        };
    }

    return {
        kind: SyntaxKind.ELEMENT,
        elementKind: ElementKind.LOCALIZED_INCLUDE,
        location: elementToken.location,
        file,
    };
}