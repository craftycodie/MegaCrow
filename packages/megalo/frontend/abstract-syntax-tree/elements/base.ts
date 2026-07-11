import { ASTElementBase, ElementKind } from ".";
import { ASTErrorNode, ASTNode, SyntaxKind } from "..";
import { diagnosticMessages } from "../../diagnostics/messages";
import { Token, TokenKind } from "../../tokens";
import { ParserContext } from "../context";
import { locationSpan } from "./game_options/shared";

type BaseElementNodeFile = ASTNode<SyntaxKind.QUOTED_STRING> & { value: string };

export type BaseElementNode = ASTElementBase<ElementKind.BASE> & {
    file: BaseElementNodeFile | ASTErrorNode;
};

export const baseParser = (ctx: ParserContext, elementToken: Token): BaseElementNode => {
    const pathToken = ctx.getToken();
    let file: BaseElementNode["file"];

    if (pathToken.kind !== TokenKind.QuotedString) {
        ctx.diagnostics.addError(
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
        elementKind: ElementKind.BASE,
        keywordLocation: elementToken.location,
        location: locationSpan(elementToken.location, pathToken.location),
        file,
    };
};
