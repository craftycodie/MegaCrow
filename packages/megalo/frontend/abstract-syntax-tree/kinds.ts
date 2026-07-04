import { SourceCodeLocation } from "../diagnostics";
import { SymbolId } from "../symbol-table";

// A numeric const enum is used for efficiency.
export const enum SyntaxKind {
    INVALID = -1,
    ELEMENT = 0,
    QUOTED_STRING = 1,
    COMMENT = 2,
    INTEGER = 3,
    REFERENCE = 4,
    KEYWORD = 5,
    PARAMETER = 6,
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

export type ASTReferenceNode = ASTNode<SyntaxKind.REFERENCE> & {
    identifier: string;
    symbolId: SymbolId;
};

export const isAstErrorNode = (node: ASTErrorNode | { value: string; location: SourceCodeLocation }): node is ASTErrorNode =>
    "kind" in node && node.kind === SyntaxKind.INVALID;
