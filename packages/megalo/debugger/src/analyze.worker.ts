import { Lexer, TokenKind, type Token } from "../../frontend/tokens/index";
import { Parser } from "../../frontend/abstract-syntax-tree/index";
import { MEGALO_VERSIONS } from "../../version";
import { Diagnostics } from "../../frontend/diagnostics";
import { setLocale } from "../../frontend/localization";
import {
  SymbolKind,
  type SymbolTable,
  type SymbolTableConstantEntry,
  type SymbolTableEntry,
  type SymbolTableGameOptionEntry,
  type SymbolTableHudWidgetEntry,
  type SymbolTableStringEntry,
  type SymbolTableVariableEntry,
} from "../../frontend/symbol-table";
import type { AnalyzeRequest, AnalyzeResponse } from "./analyze.types";

const MEGALO_VERSION = MEGALO_VERSIONS["107-mcc"];
const lexer = new Lexer(MEGALO_VERSION);
const parser = new Parser(MEGALO_VERSION);

const formatTokens = (tokens: Token[]): string =>
  JSON.stringify(
    tokens.map((token) => ({
      kind: TokenKind[token.kind] ?? token.kind,
      value: token.value,
      location: token.location,
    })),
    null,
    2,
  );

const symbolKindName = (kind: SymbolKind): string => {
  switch (kind) {
    case SymbolKind.Constant:
      return "Constant";
    case SymbolKind.Variable:
      return "Variable";
    case SymbolKind.String:
      return "String";
    case SymbolKind.GameOption:
      return "GameOption";
    case SymbolKind.HudWidget:
      return "HudWidget";
  }
};

const serializeSymbolTableEntry = (entry: SymbolTableEntry): object => {
  const base = {
    id: entry.id,
    name: entry.name,
    kind: symbolKindName(entry.kind),
    references: entry.references,
  };

  switch (entry.kind) {
    case SymbolKind.String: {
      const stringEntry = entry as SymbolTableStringEntry;
      return {
        ...base,
        languageDeclarations: [...stringEntry.languageDeclarations.entries()].map(
          ([language, declaration]) => ({ language, declaration }),
        ),
      };
    }
    case SymbolKind.Variable: {
      const variableEntry = entry as SymbolTableVariableEntry;
      return {
        ...base,
        type: variableEntry.type,
        declaration: variableEntry.declaration,
        scope: variableEntry.scope,
      };
    }
    case SymbolKind.Constant: {
      const constantEntry = entry as SymbolTableConstantEntry;
      return {
        ...base,
        type: constantEntry.type,
        declaration: constantEntry.declaration,
      };
    }
    case SymbolKind.GameOption: {
      const gameOptionEntry = entry as SymbolTableGameOptionEntry;
      return {
        ...base,
        type: gameOptionEntry.type,
        declaration: gameOptionEntry.declaration,
      };
    }
    case SymbolKind.HudWidget: {
      const hudWidgetEntry = entry as SymbolTableHudWidgetEntry;
      return {
        ...base,
        declaration: hudWidgetEntry.declaration,
      };
    }
  }

  return base;
};

const formatSymbolTable = (symbolTable: SymbolTable): string =>
  JSON.stringify(symbolTable.map(serializeSymbolTableEntry), null, 2);

self.onmessage = (event: MessageEvent<AnalyzeRequest>): void => {
  const { id, source, locale } = event.data;

  setLocale(locale);

  const diagnostics = new Diagnostics();

  const lexStart = performance.now();
  const tokens = lexer.lex(source, diagnostics);
  const lexDuration = performance.now() - lexStart;

  const parseStart = performance.now();
  const { ast, symbolTable } = parser.parse(tokens, diagnostics);
  const parseDuration = performance.now() - parseStart;

  const response: AnalyzeResponse = {
    id,
    tokensText: formatTokens(tokens),
    astText: JSON.stringify(ast, null, 2),
    symbolTableText: formatSymbolTable(symbolTable),
    tokenCount: tokens.length,
    symbolCount: symbolTable.length,
    lexDuration,
    parseDuration,
    diagnostics: [...diagnostics.getErrors(), ...diagnostics.getWarnings()],
  };

  self.postMessage(response);
};
