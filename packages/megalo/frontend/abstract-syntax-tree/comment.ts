import { ASTNode, SyntaxKind } from ".";
import { Token } from "../tokens";

export type ASTCommentNode = ASTNode<SyntaxKind.COMMENT> & { text: string };

export const commentParser = (commentToken: Token): ASTCommentNode => {
    return {
        kind: SyntaxKind.COMMENT,
        location: commentToken.location,
        text: commentToken.value,
    };
}