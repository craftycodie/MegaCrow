import type { MegaloVersion } from "../../../version";
import type { SourceCodeLocation } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { type Token, TokenKind } from "../../tokens";
import type { ParserContext } from "../context";
import { type ASTErrorNode, isAstErrorNode, SyntaxKind } from "../kinds";
import {
  type ASTParameterNode,
  parameterParserBuilder as buildParameterParser,
  type ParameterParser,
  ParameterType,
} from "../parameters";
import { type ASTElementBase, ElementKind } from ".";
import { locationSpan } from "./game_options/shared";

export type LoadoutPaletteElementNode =
  ASTElementBase<ElementKind.LOADOUT_PALETTE> & {
    name: { value: string; location: SourceCodeLocation } | ASTErrorNode;
    items: ASTParameterNode[];
  };

const parseIdentifier = (
  ctx: ParserContext,
  anchor: Token
): { value: string; location: SourceCodeLocation } | ASTErrorNode => {
  const token = ctx.getToken();
  if (token.kind === TokenKind.Identifier) {
    return {
      value: token.value,
      location: token.location,
    };
  }

  ctx.diagnostics.addError(
    diagnosticMessages.expectedTokenKind(
      TokenKind.Identifier,
      token.kind,
      token.value
    ),
    token.location
  );
  return {
    kind: SyntaxKind.INVALID,
    location: anchor.location,
  };
};

export class LoadoutPaletteParserRepository {
  private readonly parsers = new Map<string, ParameterParser>();

  private registerParser(name: string, parser: ParameterParser) {
    this.parsers.set(name, parser);
  }

  private registerParsers(_megaloVersion: MegaloVersion) {
    this.registerParser("item", buildParameterParser([ParameterType.Loadout]));
  }

  public constructor(megaloVersion: MegaloVersion) {
    this.registerParsers(megaloVersion);
  }

  public getParser(name: string): ParameterParser | undefined {
    return this.parsers.get(name);
  }
}

export const loadoutPaletteParser = (
  ctx: ParserContext,
  elementToken: Token
): LoadoutPaletteElementNode => {
  const nameToken = ctx.getToken();
  let name: LoadoutPaletteElementNode["name"];
  if (nameToken.kind === TokenKind.Identifier) {
    ctx.symbolParser.addLoadoutPaletteToScope(
      nameToken.value,
      nameToken.location
    );
    name = {
      value: nameToken.value,
      location: nameToken.location,
    };
  } else {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedTokenKind(
        TokenKind.Identifier,
        nameToken.kind,
        nameToken.value
      ),
      nameToken.location
    );
    name = {
      kind: SyntaxKind.INVALID,
      location: elementToken.location,
    };
  }

  const items: ASTParameterNode[] = [];

  while (ctx.hasMore()) {
    const itemIdentifier = parseIdentifier(ctx, elementToken);

    if (isAstErrorNode(itemIdentifier)) {
      continue;
    }

    if (itemIdentifier.value === "end") {
      return {
        kind: SyntaxKind.ELEMENT,
        elementKind: ElementKind.LOADOUT_PALETTE,
        keywordLocation: elementToken.location,
        name,
        items,
        location: locationSpan(elementToken.location, itemIdentifier.location),
      };
    }

    const parser = ctx.loadoutPaletteParserRepository.getParser(
      itemIdentifier.value
    );
    if (parser) {
      items.push(...parser(ctx, itemIdentifier.location));
    } else {
      ctx.diagnostics.addError(
        diagnosticMessages.expectedLoadoutPaletteItemOrEnd(
          itemIdentifier.value
        ),
        itemIdentifier.location
      );
    }
  }

  ctx.diagnostics.addError(
    diagnosticMessages.expectedEndBeforeEof(),
    elementToken.location
  );
  return {
    kind: SyntaxKind.ELEMENT,
    elementKind: ElementKind.LOADOUT_PALETTE,
    keywordLocation: elementToken.location,
    name,
    items,
    location: elementToken.location,
  };
};
