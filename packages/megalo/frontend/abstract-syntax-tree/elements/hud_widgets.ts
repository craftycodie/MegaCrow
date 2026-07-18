import { type SourceCodeLocation, SourceLocationType } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { type Token, TokenKind } from "../../tokens";
import { type ASTErrorNode, SyntaxKind } from "..";
import type { ParserContext } from "../context";
import { type ASTElementBase, ElementKind } from ".";
import { locationSpan } from "./game_options/shared";

type HudWidgetEntryNodeName = {
  value: string;
  location: SourceCodeLocation;
};

type HudWidgetEntryNodePosition = {
  value: string;
  location: SourceCodeLocation;
};

export type HudWidgetEntryNode = {
  name: HudWidgetEntryNodeName | ASTErrorNode;
  position: HudWidgetEntryNodePosition | ASTErrorNode;
  location: SourceCodeLocation;
};

export type HudWidgetsElementNode = ASTElementBase<ElementKind.HUD_WIDGETS> & {
  entries: HudWidgetEntryNode[];
};

const parseHudWidgetEntry = (ctx: ParserContext): HudWidgetEntryNode => {
  const nameToken = ctx.getToken();
  let name: HudWidgetEntryNode["name"];
  if (nameToken.kind === TokenKind.Identifier) {
    ctx.symbolParser.addHudWidgetToScope(nameToken.value, nameToken.location);
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

  const positionToken = ctx.getToken();
  let position: HudWidgetEntryNode["position"];
  if (positionToken.kind === TokenKind.Identifier) {
    position = {
      value: positionToken.value,
      location: positionToken.location,
    };
  } else {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedTokenKind(
        TokenKind.Identifier,
        positionToken.kind,
        positionToken.value
      ),
      positionToken.location
    );
    position = {
      kind: SyntaxKind.INVALID,
      location: positionToken.location,
    };
  }

  return {
    name,
    position,
    location: {
      type: SourceLocationType.SOURCE_CODE,
      start: nameToken.location.start,
      end: positionToken.location.end,
    },
  };
};

export const hudWidgetsParser = (
  ctx: ParserContext,
  elementToken: Token
): HudWidgetsElementNode => {
  const entries: HudWidgetEntryNode[] = [];

  ctx.parseUntilEnd(() => {
    entries.push(parseHudWidgetEntry(ctx));
  });

  const endToken = ctx.peekToken(-1);
  const endLocation =
    endToken?.location ?? entries.at(-1)?.location ?? elementToken.location;

  return {
    kind: SyntaxKind.ELEMENT,
    elementKind: ElementKind.HUD_WIDGETS,
    keywordLocation: elementToken.location,
    location: locationSpan(elementToken.location, endLocation),
    entries,
  };
};
