import { ASTNode, SyntaxKind } from "..";
import { MegaloVersion } from "../../../version";
import { Token, Tokens } from "../../tokens";
import { ParserContext } from "../context";
import { CommentElementNode, commentParser } from "./comment";

import { IncludeElementNode, includeParser } from "./include";

// REGISTERING NEW ELEMENTS:
// - Add an ElementKind enum value.
// - Create a new parser function and add it to registerParsers.
// - Add the return type of the parser to the ASTElementNode discriminated union.
// (we will probably very rarely do this lol)

export const enum ElementKind {
    INCLUDE,
    COMMENT,
}

// used by elements
export type ASTElementBase<K extends ElementKind> = ASTNode<SyntaxKind.ELEMENT> & { elementKind: K };
// only used here to enforce ASTElementNode discrim union members implement ASTElementBase
type ASTElementNodeWithBase<T extends ASTElementBase<any>> = T;

export type ASTElementNode = ASTElementNodeWithBase<
    IncludeElementNode
    | CommentElementNode
>

export type ElementParser<E extends ASTElementNode> = (ctx: ParserContext, elementToken: Token) => E;

// ElementParserRepository is Workspace lifecycle - it is instanced per workspace.
export class ElementParserRepository {
    // We could proooobably get away with using a static object here,
    // but building up based on the megalo version allows us to configure
    // alternate parsers for different megalo versions if necessary.
    private readonly parsers: Record<string, ElementParser<ASTElementNode>> = {};

    private registerParser(name: string, parser: ElementParser<ASTElementNode>) {
        this.parsers[name] = parser;
    }

    private registerParsers(megaloVersion: MegaloVersion) {
        this.registerParser("comment", commentParser);
        this.registerParser("include", includeParser);
    }

    public constructor(megaloVersion: MegaloVersion) {
        this.registerParsers(megaloVersion);
    }

    public getParser(name: string) {
        return this.parsers[name];
    }
}