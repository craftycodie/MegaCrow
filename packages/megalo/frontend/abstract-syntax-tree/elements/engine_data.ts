import type { SourceCodeLocation } from "../../diagnostics";
import type { MegaloVersion } from "../../../version";
import { diagnosticMessages } from "../../diagnostics/messages";
import {
  ENGINE_CATEGORY_STRING_PREFIX,
  type EngineDataPropertyKey,
} from "../../language-configuration/omni/engine_data";
import { type Token, TokenKind } from "../../tokens";
import type { ParserContext } from "../context";
import { isAstErrorNode, SyntaxKind } from "../kinds";
import {
  type ASTParameterNode,
  parameterParserBuilder as buildParameterParser,
  type ParameterParser,
  ParameterType,
} from "../parameters";
import { type ASTElementBase, ElementKind } from ".";
import {
  isEndToken,
  locationSpan,
  parseIdentifier,
} from "./game_options/shared";

/**
 * `category vip` resolves the string symbol `engine_category_vip`, not `vip`.
 */
const parseEngineCategoryParameter: ParameterParser = (
  ctx: ParserContext,
  anchor: SourceCodeLocation
): ASTParameterNode[] => {
  const peek = ctx.peekToken();
  if (!peek || isEndToken(peek) || peek.kind !== TokenKind.Identifier) {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedTokenKind(
        TokenKind.Identifier,
        peek?.kind ?? TokenKind.None,
        peek?.value ?? ""
      ),
      anchor
    );
    return [
      {
        kind: SyntaxKind.INVALID,
        location: anchor,
      },
    ];
  }

  const token = ctx.getToken();
  const symbolName = `${ENGINE_CATEGORY_STRING_PREFIX}${token.value}`;
  const symbolId = ctx.symbolParser.lookupString(symbolName);
  if (symbolId === undefined) {
    ctx.diagnostics.addError(
      diagnosticMessages.invalidStringIdentifier(symbolName),
      token.location
    );
    return [
      {
        kind: SyntaxKind.INVALID,
        location: token.location,
      },
    ];
  }

  ctx.symbolParser.recordReference(symbolId, token.location);
  return [
    {
      kind: SyntaxKind.REFERENCE,
      identifier: token.value,
      symbolId,
      location: token.location,
    },
  ];
};

export type EngineDataPropertyNode = {
  identifier: EngineDataPropertyKey;
  parameters: ASTParameterNode[];
};

export type EngineDataElementNode = ASTElementBase<ElementKind.ENGINE_DATA> & {
  properties: EngineDataPropertyNode[];
};

export class EngineDataParserRepository {
  private readonly parsers = new Map<string, ParameterParser>();

  private registerParser(name: EngineDataPropertyKey, parser: ParameterParser) {
    this.parsers.set(name, parser);
  }

  private registerParsers(_megaloVersion: MegaloVersion) {
    this.registerParser("name", buildParameterParser([ParameterType.String]));
    this.registerParser(
      "description",
      buildParameterParser([ParameterType.String])
    );
    this.registerParser("icon", buildParameterParser([ParameterType.Number]));
    this.registerParser("category", parseEngineCategoryParameter);
  }

  public constructor(megaloVersion: MegaloVersion) {
    this.registerParsers(megaloVersion);
  }

  public getParser(name: string): ParameterParser | undefined {
    return this.parsers.get(name);
  }
}

export const engineDataParser = (
  ctx: ParserContext,
  elementToken: Token
): EngineDataElementNode => {
  const properties: EngineDataPropertyNode[] = [];

  while (ctx.hasMore()) {
    const token = ctx.peekToken();
    if (!token) {
      break;
    }

    if (isEndToken(token)) {
      const endToken = ctx.getToken();
      return {
        kind: SyntaxKind.ELEMENT,
        elementKind: ElementKind.ENGINE_DATA,
        keywordLocation: elementToken.location,
        properties,
        location: locationSpan(elementToken.location, endToken.location),
      };
    }

    const propertyIdentifier = parseIdentifier(ctx, elementToken);

    if (isAstErrorNode(propertyIdentifier)) {
      continue;
    }

    const parser = ctx.engineDataParserRepository.getParser(
      propertyIdentifier.value
    );
    if (parser) {
      properties.push({
        identifier: propertyIdentifier.value as EngineDataPropertyKey,
        parameters: parser(ctx, propertyIdentifier.location),
      });
    } else {
      ctx.diagnostics.addError(
        diagnosticMessages.unknownEngineDataProperty(propertyIdentifier.value),
        propertyIdentifier.location
      );
    }
  }

  ctx.diagnostics.addError(
    diagnosticMessages.expectedEndBeforeEof(),
    elementToken.location
  );
  return {
    kind: SyntaxKind.ELEMENT,
    elementKind: ElementKind.ENGINE_DATA,
    keywordLocation: elementToken.location,
    properties,
    location: elementToken.location,
  };
};
