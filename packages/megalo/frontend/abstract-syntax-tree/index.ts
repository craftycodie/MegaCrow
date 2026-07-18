import type { MegaloVersion } from "../../version";
import type { Diagnostics } from "../diagnostics";
import { diagnosticMessages } from "../diagnostics/messages";
import type { ObjectLists } from "../object-lists";
import { SymbolBinder, type SymbolTable } from "../symbol-table";
import { TokenKind, type Tokens } from "../tokens";
import { type ASTCommentNode, collectComments } from "./comment";
import { ParserContext } from "./context";
import { type ASTElementNode, ElementParserRepository } from "./elements";

export {
  type ASTErrorNode,
  type ASTFloatingPointNode,
  type ASTIntegerNode,
  type ASTNode,
  type ASTReferenceNode,
  isAstErrorNode,
  SyntaxKind,
} from "./kinds";

export type AST = {
  failed: boolean;
  comments: ASTCommentNode[];
  elements: ASTElementNode[];
  symbolTable: SymbolTable;
};

// Parser is Frontend lifecycle - it is instanced per workspace.
export class Parser {
  private megaloVersion: MegaloVersion;
  private elementParserRepository: ElementParserRepository;

  public constructor(megaloVersion: MegaloVersion) {
    this.megaloVersion = megaloVersion;
    this.elementParserRepository = new ElementParserRepository(megaloVersion);
  }

  public parse = (
    tokens: Tokens,
    diagnostics: Diagnostics,
    objectLists: ObjectLists = {}
  ): AST => {
    // Pass 1. Collect comments
    // This allows us to skip comments when parsing elements.
    const comments = collectComments(tokens);

    // Pass 2. Parse elements.
    // (everything else)
    const elements: ASTElementNode[] = [];
    const tokensWithoutComments = tokens.filter(
      (token) => token.kind !== TokenKind.Comment
    );
    const symbolBinder = new SymbolBinder(this.megaloVersion, diagnostics);
    const ctx = new ParserContext(
      tokensWithoutComments,
      this.megaloVersion,
      diagnostics,
      symbolBinder,
      objectLists
    );

    while (ctx.hasMore()) {
      const token = ctx.getToken();

      // Process top-level elements, delegate members to the appropriate parser.
      switch (token.kind) {
        case TokenKind.Identifier: {
          const identifier = token.value;
          const parser = this.elementParserRepository.getParser(identifier);
          if (parser) {
            elements.push(parser(ctx, token));
          } else {
            // MegaloEdit.exe: "Expected one of 'string_table|game_options|constants|loadout|loadout_palette|include|localized_include|teams|engine_data|player_rating|map_permissions|variables|trigger|requisition_palette|hud_widgets|map_object|game_stats' but got '<identifier>'"
            // We do our own thing here.
            ctx.diagnostics.addError(
              diagnosticMessages.expectedElement(token.value),
              token.location
            );
          }
          break;
        }

        case TokenKind.Comment:
        case TokenKind.MemberVariableSeparator:
        case TokenKind.QuotedString:
        case TokenKind.Integer:
        case TokenKind.FloatingPoint:
          ctx.diagnostics.addError(
            diagnosticMessages.expectedElement(token.value),
            token.location
          );
          break;
      }
    }

    const symbolTable = symbolBinder.getSymbolTable();
    const failed = ctx.diagnostics.hasErrors();

    return {
      failed,
      comments,
      elements,
      symbolTable,
    };
  };
}
