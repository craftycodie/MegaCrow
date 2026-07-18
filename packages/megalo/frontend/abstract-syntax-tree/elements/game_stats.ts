import { type SourceCodeLocation, SourceLocationType } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { type Token, TokenKind } from "../../tokens";
import { type ASTErrorNode, type ASTIntegerNode, SyntaxKind } from "..";
import type { ParserContext } from "../context";
import { isAstErrorNode } from "../kinds";
import type { ASTKeywordParameterNode } from "../parameters";
import {
  type ASTStringLiteralOrReference,
  parseStringLiteralOrReference,
} from "../parameters/string_literal_or_reference";
import { type ASTElementBase, ElementKind } from ".";
import { isEndToken, locationSpan } from "./game_options/shared";

const GAME_STAT_FORMAT_KINDS = new Set([
  "number",
  "timer",
  "delta",
  "percentage",
]);

type GameStatEntryNodeName = { value: string; location: SourceCodeLocation };
type GameStatEntryNodeType = { value: string; location: SourceCodeLocation };

export type GameStatUnitStringNode =
  | ASTStringLiteralOrReference
  | ASTKeywordParameterNode;

export type GameStatEntryNode = {
  name: GameStatEntryNodeName | ASTErrorNode;
  type: GameStatEntryNodeType | ASTErrorNode;
  labelString: ASTStringLiteralOrReference;
  unitString: GameStatUnitStringNode;
  flags: ASTIntegerNode | ASTErrorNode;
  location: SourceCodeLocation;
};

export type GameStatsElementNode = ASTElementBase<ElementKind.GAME_STATS> & {
  entries: GameStatEntryNode[];
};

const parseIdentifierField = (
  ctx: ParserContext,
  anchor: Token
): GameStatEntryNodeName | ASTErrorNode => {
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

const parseStatFormat = (
  ctx: ParserContext,
  anchor: Token
): GameStatEntryNodeType | ASTErrorNode => {
  const token = ctx.getToken();
  if (token.kind !== TokenKind.Identifier) {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedParameterType(
        "statistic format (number, timer, delta, percentage)",
        token.value
      ),
      token.location
    );
    return {
      kind: SyntaxKind.INVALID,
      location: anchor.location,
    };
  }

  if (!GAME_STAT_FORMAT_KINDS.has(token.value)) {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedParameterType(
        "statistic format (number, timer, delta, percentage)",
        token.value
      ),
      token.location
    );
    return {
      kind: SyntaxKind.INVALID,
      location: token.location,
    };
  }

  return {
    value: token.value,
    location: token.location,
  };
};

/** Unit may be a string literal/reference, or the keyword `none`. */
const parseUnitString = (
  ctx: ParserContext,
  anchor: Token
): GameStatUnitStringNode => {
  const peek = ctx.peekToken();
  if (peek?.kind === TokenKind.Identifier && peek.value === "none") {
    const noneToken = ctx.getToken();
    return {
      kind: SyntaxKind.KEYWORD,
      value: noneToken.value,
      location: noneToken.location,
    };
  }

  return parseStringLiteralOrReference(ctx, anchor);
};

const parseFlags = (
  ctx: ParserContext,
  anchor: Token
): ASTIntegerNode | ASTErrorNode => {
  const token = ctx.getToken();
  if (token.kind === TokenKind.Integer) {
    return {
      kind: SyntaxKind.INTEGER,
      value: Number.parseInt(token.value, 10),
      location: token.location,
    };
  }

  ctx.diagnostics.addError(
    diagnosticMessages.expectedParameterType("number", token.value),
    token.location
  );
  return {
    kind: SyntaxKind.INVALID,
    location: anchor.location,
  };
};

const parseGameStatEntry = (ctx: ParserContext): GameStatEntryNode => {
  const anchor = ctx.peekToken()!;
  const name = parseIdentifierField(ctx, anchor);
  const nameLocation = isAstErrorNode(name) ? anchor.location : name.location;

  const type = parseStatFormat(ctx, anchor);
  const labelString = parseStringLiteralOrReference(ctx, anchor);
  const unitString = parseUnitString(ctx, anchor);
  const flags = parseFlags(ctx, anchor);

  return {
    name,
    type,
    labelString,
    unitString,
    flags,
    location: {
      type: SourceLocationType.SOURCE_CODE,
      start: nameLocation.start,
      end: flags.location.end,
    },
  };
};

export const gameStatsParser = (
  ctx: ParserContext,
  elementToken: Token
): GameStatsElementNode => {
  const entries: GameStatEntryNode[] = [];

  while (ctx.hasMore()) {
    const token = ctx.peekToken();
    if (!token) {
      break;
    }

    if (isEndToken(token)) {
      const endToken = ctx.getToken();
      return {
        kind: SyntaxKind.ELEMENT,
        elementKind: ElementKind.GAME_STATS,
        keywordLocation: elementToken.location,
        entries,
        location: locationSpan(elementToken.location, endToken.location),
      };
    }

    entries.push(parseGameStatEntry(ctx));
  }

  ctx.diagnostics.addError(
    diagnosticMessages.expectedEndBeforeEof(),
    elementToken.location
  );
  return {
    kind: SyntaxKind.ELEMENT,
    elementKind: ElementKind.GAME_STATS,
    keywordLocation: elementToken.location,
    entries,
    location: elementToken.location,
  };
};
