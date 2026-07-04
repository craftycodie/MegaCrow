import { ASTElementBase, ElementKind } from "./elements";
import { ASTNode, SyntaxKind } from ".";
import { SourceLocation } from "../diagnostics";
import { Token } from "../tokens";
import { ParserContext } from "./context";

export type ASTCommentNode = ASTNode<SyntaxKind.COMMENT> & { text: string };

export const commentParser = (commentToken: Token): ASTCommentNode => {
    return {
        kind: SyntaxKind.COMMENT,
        location: commentToken.location,
        text: commentToken.value,
    };
}