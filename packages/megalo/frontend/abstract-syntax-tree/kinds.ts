import { SourceCodeLocation } from "../diagnostics";

// A numeric const enum is used for efficiency.
export const enum SyntaxKind {
    INVALID = -1,
    ELEMENT = 0,
    QUOTED_STRING = 1,
    COMMENT = 2,
    INTEGER = 3,
    REFERENCE = 4,
    KEYWORD = 5,
    FLOATING_POINT = 7,
    MEMBER_REFERENCE = 8,
    CONDITION = 9,
    ACTION = 10,
    BEGIN = 11,
    TEMPORARY = 12,
    FOR_EACH = 13,
    DYNAMIC_STRING = 14,
}

export type ASTNode<K extends SyntaxKind> = {
    kind: K;
    location: SourceCodeLocation;
};

export type ASTErrorNode = {
    kind: SyntaxKind.INVALID;
    location: SourceCodeLocation;
};

export type ASTIntegerNode = ASTNode<SyntaxKind.INTEGER> & {
    value: number;
};

export type ASTFloatingPointNode = ASTNode<SyntaxKind.FLOATING_POINT> & {
    value: number;
};

export type ASTReferenceNode = ASTNode<SyntaxKind.REFERENCE> & {
    identifier: string;
};

export type ASTMemberReferenceNode = ASTNode<SyntaxKind.MEMBER_REFERENCE> & {
    root: string;
    member: { value: string; location: SourceCodeLocation };
};

export const isAstErrorNode = (node: ASTErrorNode | { value: string; location: SourceCodeLocation }): node is ASTErrorNode =>
    "kind" in node && node.kind === SyntaxKind.INVALID;
