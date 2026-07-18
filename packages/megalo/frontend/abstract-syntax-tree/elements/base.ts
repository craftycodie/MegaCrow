import { diagnosticMessages } from "../../diagnostics/messages";
import { type Token, TokenKind } from "../../tokens";
import { type ASTErrorNode, type ASTNode, SyntaxKind } from "..";
import type { ParserContext } from "../context";
import { type ASTElementBase, ElementKind } from ".";
import { locationSpan } from "./game_options/shared";

type BaseElementNodeFile = ASTNode<SyntaxKind.QUOTED_STRING> & {
  value: string;
};

export type BaseElementNode = ASTElementBase<ElementKind.BASE> & {
  file: BaseElementNodeFile | ASTErrorNode;
};

export const baseParser = (
  ctx: ParserContext,
  elementToken: Token
): BaseElementNode => {
  const pathToken = ctx.getToken();
  let file: BaseElementNode["file"];

  if (pathToken.kind === TokenKind.QuotedString) {
    file = {
      kind: SyntaxKind.QUOTED_STRING,
      location: pathToken.location,
      value: pathToken.value,
    };
  } else {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedTokenKind(
        TokenKind.QuotedString,
        pathToken.kind,
        pathToken.value
      ),
      pathToken.location
    );
    file = {
      kind: SyntaxKind.INVALID,
      location: pathToken.location,
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
