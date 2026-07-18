import {
  type SourceCodeLocation,
  SourceLocationType,
} from "../../../diagnostics";
import { diagnosticMessages } from "../../../diagnostics/messages";
import { variableTypeFromName } from "../../../language-configuration/omni/variables";
import { VariableScope } from "../../../symbol-table";
import { type Token, TokenKind } from "../../../tokens";
import type { ParserContext } from "../../context";
import { type ASTNode, SyntaxKind } from "../../kinds";
import { type ASTConditionOperandNode, parseIfOperand } from "./operand";

export const TEMPORARY_STORAGE_NAMES = [
  "number",
  "object",
  "team",
  "player",
] as const;
export type TemporaryStorageName = (typeof TEMPORARY_STORAGE_NAMES)[number];

export const isTemporaryStorageName = (
  value: string
): value is TemporaryStorageName =>
  (TEMPORARY_STORAGE_NAMES as readonly string[]).includes(value);

export type TemporaryStatementNode = ASTNode<SyntaxKind.TEMPORARY> & {
  storage: { value: TemporaryStorageName; location: SourceCodeLocation };
  name: { value: string; location: SourceCodeLocation };
  initial: ASTConditionOperandNode;
};

const locationSpan = (
  start: SourceCodeLocation,
  end: SourceCodeLocation
): SourceCodeLocation => ({
  type: SourceLocationType.SOURCE_CODE,
  start: start.start,
  end: end.end,
});

const isTriggerStatementBoundary = (token: Token | undefined): boolean =>
  !token ||
  (token.kind === TokenKind.Identifier &&
    (token.value === "end" ||
      token.value === "condition" ||
      token.value === "action" ||
      token.value === "begin" ||
      token.value === "temporary"));

const parseTemporaryStorage = (
  ctx: ParserContext,
  anchor: Token
): TemporaryStatementNode["storage"] | undefined => {
  const token = ctx.peekToken();
  if (token?.kind !== TokenKind.Identifier) {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedTokenKind(
        TokenKind.Identifier,
        token?.kind ?? TokenKind.None,
        token?.value ?? ""
      ),
      token?.location ?? anchor.location
    );
    return;
  }

  const storageToken = ctx.getToken();
  if (!isTemporaryStorageName(storageToken.value)) {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedTemporaryStorage(storageToken.value),
      storageToken.location
    );
    return;
  }

  return {
    value: storageToken.value,
    location: storageToken.location,
  };
};

const parseTemporaryName = (
  ctx: ParserContext,
  anchor: Token
): TemporaryStatementNode["name"] | undefined => {
  const token = ctx.peekToken();
  if (token?.kind !== TokenKind.Identifier) {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedTokenKind(
        TokenKind.Identifier,
        token?.kind ?? TokenKind.None,
        token?.value ?? ""
      ),
      token?.location ?? anchor.location
    );
    return;
  }

  const nameToken = ctx.getToken();
  return {
    value: nameToken.value,
    location: nameToken.location,
  };
};

export const parseTemporary = (
  ctx: ParserContext,
  temporaryToken: Token
): TemporaryStatementNode => {
  const storage = parseTemporaryStorage(ctx, temporaryToken);
  const name = parseTemporaryName(ctx, temporaryToken);

  if (storage !== undefined && name !== undefined) {
    ctx.symbolParser.addVariableToScope({
      name: name.value,
      type: variableTypeFromName(storage.value),
      declaration: name.location,
      scope: VariableScope.Global,
    });
  }

  if (isTriggerStatementBoundary(ctx.peekToken())) {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedTemporaryInitial(),
      name?.location ?? temporaryToken.location
    );
    return {
      kind: SyntaxKind.TEMPORARY,
      storage: storage ?? {
        value: "number",
        location: temporaryToken.location,
      },
      name: name ?? { value: "", location: temporaryToken.location },
      initial: {
        kind: SyntaxKind.INVALID,
        location: temporaryToken.location,
      },
      location: temporaryToken.location,
    };
  }

  const initial = parseIfOperand(
    ctx,
    name?.location ?? temporaryToken.location
  );

  return {
    kind: SyntaxKind.TEMPORARY,
    storage: storage ?? { value: "number", location: temporaryToken.location },
    name: name ?? { value: "", location: temporaryToken.location },
    initial,
    location: locationSpan(temporaryToken.location, initial.location),
  };
};
