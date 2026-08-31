import {
  spanSourceCodeLocations as locationSpan,
  type SourceCodeLocation,
} from "src/diagnostics";
import { diagnosticMessages } from "src/diagnostics/messages";
import type { ParserContext } from "src/frontend/abstract-syntax-tree/context";
import {
  type ASTConditionOperandNode,
  parseIfOperand,
} from "src/frontend/abstract-syntax-tree/elements/trigger/operand";
import {
  type ASTNode,
  SyntaxKind,
} from "src/frontend/abstract-syntax-tree/kinds";
import { isTriggerStatementBoundary } from "src/frontend/abstract-syntax-tree/parameters";
import { variableTypeFromName } from "src/frontend/language-configuration/omni/variables";
import { VariableScope } from "src/frontend/symbol-table";
import { type Token, TokenKind } from "src/frontend/tokens";

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
  name: { value: string; location: SourceCodeLocation; symbolId?: number };
  initial: ASTConditionOperandNode;
};

interface ParsedTemporaryStorage {
  accepted: boolean;
  storage: TemporaryStatementNode["storage"];
}

const parseTemporaryStorage = (
  ctx: ParserContext,
  anchor: Token
): ParsedTemporaryStorage | undefined => {
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
    // Keep the bad token's span so completion still targets storage (slot 0).
    return {
      accepted: false,
      storage: {
        value: "number",
        location: storageToken.location,
      },
    };
  }

  return {
    accepted: true,
    storage: {
      value: storageToken.value,
      location: storageToken.location,
    },
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
  const parsedStorage = parseTemporaryStorage(ctx, temporaryToken);
  const storage = parsedStorage?.storage;
  const name = parseTemporaryName(ctx, temporaryToken);

  let symbolId: number | undefined;
  if (parsedStorage?.accepted === true && name !== undefined) {
    symbolId = ctx.symbolParser.addVariableToScope({
      name: name.value,
      type: variableTypeFromName(parsedStorage.storage.value),
      declaration: name.location,
      scope: VariableScope.Temporary,
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
      name:
        symbolId === undefined
          ? (name ?? { value: "", location: temporaryToken.location })
          : {
              ...(name ?? { value: "", location: temporaryToken.location }),
              symbolId,
            },
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

  const nameNode = name ?? { value: "", location: temporaryToken.location };
  return {
    kind: SyntaxKind.TEMPORARY,
    storage: storage ?? { value: "number", location: temporaryToken.location },
    name: symbolId === undefined ? nameNode : { ...nameNode, symbolId },
    initial,
    location: locationSpan(temporaryToken.location, initial.location),
  };
};
