import { ASTElementBase, ASTElementNode, ElementKind } from ".";
import { ASTErrorNode, ASTNode, SyntaxKind } from "..";
import { diagnosticMessages } from "../../diagnostics/messages";
import { Token, TokenKind } from "../../tokens";
import { ParserContext } from "../context";
import { locationSpan } from "./game_options/shared";

type IncludeElementNodeFile = ASTNode<SyntaxKind.QUOTED_STRING> & { value: string };

export type IncludeElementNode = ASTElementBase<ElementKind.INCLUDE> & {
    file: IncludeElementNodeFile | ASTErrorNode;
}

export const includeParser = (ctx: ParserContext, elementToken: Token): IncludeElementNode => {
    const pathToken = ctx.getToken();
    let file: IncludeElementNode["file"];

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
        elementKind: ElementKind.INCLUDE,
        keywordLocation: elementToken.location,
        location: locationSpan(elementToken.location, pathToken.location),
        file,
    };
}