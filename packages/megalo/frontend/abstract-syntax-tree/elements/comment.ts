import { ASTElementBase, ElementKind } from ".";
import { ASTNode, SyntaxKind } from "..";
import { SourceLocation } from "../../diagnostics";
import { Token } from "../../tokens";
import { ParserContext } from "../context";

type CommentElementNodeContent = { text: string, location: SourceLocation };

export type CommentElementNode = ASTElementBase<ElementKind.COMMENT> & {
    comment: CommentElementNodeContent;
}

export const commentParser = (ctx: ParserContext, elementToken: Token): CommentElementNode => {
    const commentMessage = ctx.getToken();

    return {
        kind: SyntaxKind.ELEMENT,
        elementKind: ElementKind.COMMENT,
        location: elementToken.location,
        comment: {
            text: commentMessage.value,
            location: commentMessage.location,
        },
    };
}