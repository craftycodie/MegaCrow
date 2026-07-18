import { diagnosticMessages } from "../../../diagnostics/messages";
import { VariableType } from "../../../symbol-table";
import { type Token, TokenKind } from "../../../tokens";
import { SyntaxKind } from "../..";
import type { ParserContext } from "../../context";
import {
  parseStringLiteralOrReference,
  stringLiteralOrReferenceLocation,
} from "../../parameters/string_literal_or_reference";
import { parseNumericInitialValue } from "../constants";
import { isEndToken, locationSpan } from "./shared";
import {
  GameOptionEntryKind,
  type GameOptionModifiers,
  type UserDefinedOptionNode,
  type UserDefinedOptionValueNode,
} from "./types";

const parseUserDefinedOptionValue = (
  ctx: ParserContext,
  ranged: boolean,
  anchor: Token
): UserDefinedOptionValueNode => {
  const value = parseNumericInitialValue(ctx, anchor);
  if (ranged) {
    return {
      value,
      location: value.location,
    };
  }

  const name = parseStringLiteralOrReference(ctx, anchor);
  const description = parseStringLiteralOrReference(ctx, anchor);

  return {
    value,
    name,
    description,
    location: locationSpan(
      anchor.location,
      stringLiteralOrReferenceLocation(description)
    ),
  };
};

export const parseUserDefinedOption = (
  ctx: ParserContext,
  keywordToken: Token,
  modifiers: GameOptionModifiers,
  ranged: boolean
): UserDefinedOptionNode => {
  const nameToken = ctx.getToken();
  let name: UserDefinedOptionNode["name"];
  if (nameToken.kind === TokenKind.Identifier) {
    ctx.symbolParser.addGameOptionToScope({
      name: nameToken.value,
      declaration: nameToken.location,
      type: VariableType.Number,
    });
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
      location: nameToken.location,
    };
  }

  const displayName = parseStringLiteralOrReference(ctx, nameToken);
  const description = parseStringLiteralOrReference(ctx, nameToken);
  const defaultValue = parseNumericInitialValue(ctx, nameToken);
  const values: UserDefinedOptionValueNode[] = [];

  while (ctx.hasMore()) {
    const peek = ctx.peekToken()!;
    if (isEndToken(peek)) {
      ctx.getToken();
      break;
    }

    if (ranged && values.length >= 2) {
      ctx.diagnostics.addError(
        diagnosticMessages.expectedGameOptionElement("end"),
        peek.location
      );
      ctx.getToken();
      continue;
    }

    values.push(parseUserDefinedOptionValue(ctx, ranged, nameToken));
  }

  const lastLocation = values.at(-1)?.location ?? defaultValue.location;

  return {
    kind: ranged
      ? GameOptionEntryKind.RANGED_OPTION
      : GameOptionEntryKind.OPTION,
    modifiers,
    name,
    displayName,
    description,
    defaultValue,
    values,
    location: locationSpan(keywordToken.location, lastLocation),
  };
};

export const optionParser = (
  ctx: ParserContext,
  keywordToken: Token,
  modifiers: GameOptionModifiers
): UserDefinedOptionNode =>
  parseUserDefinedOption(ctx, keywordToken, modifiers, false);
