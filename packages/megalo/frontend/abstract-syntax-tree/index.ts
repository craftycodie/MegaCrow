import { MegaloVersion } from "../../version";
import { Diagnostics } from "../diagnostics";
import { diagnosticMessages } from "../diagnostics/messages";
import { SymbolBinder, SymbolTable } from "../symbol-table";
import { TokenKind, Tokens } from "../tokens"
import { ASTCommentNode, collectComments } from "./comment";
import { ParserContext } from "./context";
import { ASTElementNode, ElementParserRepository } from "./elements";
export { SyntaxKind, isAstErrorNode, type ASTErrorNode, type ASTFloatingPointNode, type ASTIntegerNode, type ASTNode, type ASTReferenceNode } from "./kinds";

export type AST = {
    failed: boolean;
    comments: ASTCommentNode[];
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

    public parse = (tokens: Tokens, diagnostics: Diagnostics): AST => {
        // AST is managed by this function, so is not included in Parser Context.
        const ast: AST = {
            failed: false,
            comments: [],
            elements: [],
        };

        // Pass 1. Collect comments
        // This allows us to skip comments when parsing elements.
        ast.comments = collectComments(tokens);

        // Pass 2. Parse elements.
        // (everything else)
        const tokensWithoutComments = tokens.filter(token => token.kind !== TokenKind.Comment);
        const symbolBinder = new SymbolBinder(this.megaloVersion, diagnostics);
        const ctx = new ParserContext(tokensWithoutComments, this.megaloVersion, diagnostics, symbolBinder);

        while (ctx.hasMore()) {
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
                        ctx.diagnostics.addError(diagnosticMessages.expectedElement(token.value), token.location);
                    }
                    break;

                case TokenKind.Comment:
                case TokenKind.MemberVariableSeparator:
                case TokenKind.QuotedString:
                case TokenKind.Integer:
                case TokenKind.FloatingPoint:
                    ctx.diagnostics.addError(diagnosticMessages.expectedElement(token.value), token.location);
                    break;
            }
        }

        ast.failed = ctx.diagnostics.hasErrors();

        return ast;
    }
}