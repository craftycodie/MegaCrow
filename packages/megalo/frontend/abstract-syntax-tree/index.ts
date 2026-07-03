import { MegaloVersion } from "../../version";
import { Diagnostics, SourceLocation } from "../diagnostics";
import { Token, TokenKind, Tokens } from "../tokens"
import { ParserContext } from "./context";
import { ASTElementNode, ElementParserRepository } from "./elements";

// A numeric const enum is used for efficiency.
export const enum SyntaxKind {
    INVALID = -1,
    ELEMENT = 0,
    QUOTED_STRING = 1,
}

// The details of the error are handled by diagnostics.
// So for now we just move on.
export type ASTErrorNode = {
    kind: SyntaxKind.INVALID;
    location: SourceLocation;
}

export type ASTNode<K extends SyntaxKind> = {
    kind: K;
    location: SourceLocation;
}

export type AST = {
    failed: boolean;
    elements: ASTElementNode[];
}

// Parser is Frontend lifecycle - it is instanced per workspace.
export class Parser {
    private megaloVersion: MegaloVersion;
    private elementParserRepository: ElementParserRepository;

    public constructor(megaloVersion: MegaloVersion) {
        this.megaloVersion = megaloVersion;
        this.elementParserRepository = new ElementParserRepository(megaloVersion);
    }

    public parse = (source: Tokens, diagnostics: Diagnostics): AST => {
        // AST is managed by this function, so is not included in Parser Context.
        const ast: AST = {
            failed: false,
            elements: [],
        };
        
        const ctx = new ParserContext(source, this.megaloVersion, diagnostics);
        
        while (ctx.available() > 0) {
            const token = ctx.getToken();

            // Process top-level elements, delegate members to the appropriate parser.
            switch (token.kind) {
                case TokenKind.Identifier:
                    const identifier = token.value;
                    const parser = this.elementParserRepository.getParser(identifier);
                    if (parser) {
                        ast.elements.push(parser(ctx, token));
                    }
                    else {
                        // MegaloEdit.exe: "Expected one of 'string_table|game_options|constants|loadout|loadout_palette|include|localized_include|teams|engine_data|player_rating|map_permissions|variables|trigger|requisition_palette|hud_widgets|map_object|game_stats' but got '<identifier>'"
                        // We do our own thing here.
                        ctx.diagnostics.addError(`Expected an element, got ${token.value}`, token.location);
                    }
                    break;
                case TokenKind.Comment:
                    // This should never really fail,
                    // but on off chance the comment changes syntax in some version...
                    const commentParser = this.elementParserRepository.getParser("comment");
                    if (commentParser) {
                        ast.elements.push(commentParser(ctx, token));
                    }
                    else {
                        ctx.diagnostics.addError(`Expected a comment, got ${token.value}`, token.location);
                    }
                    break;
                case TokenKind.MemberVariableSeparator:
                case TokenKind.QuotedString:
                case TokenKind.Integer:
                case TokenKind.FloatingPoint:
                    ctx.diagnostics.addError(`Expected an element, got ${token.value}`, token.location);
                    break;
            }
        }

        ast.failed = ctx.diagnostics.hasErrors();

        return ast;
    }
}