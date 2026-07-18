import { Parser } from "../../frontend/abstract-syntax-tree/index";
import { getCompilerForVersion } from "../../frontend/compile";
import { Diagnostics } from "../../frontend/diagnostics";
import { Lowerer } from "../../frontend/intermediate-representation";
import { setLocale } from "../../frontend/localization";
import {
  SymbolKind,
  type SymbolTable,
  type SymbolTableConstantEntry,
  type SymbolTableEntry,
  type SymbolTableGameOptionEntry,
  type SymbolTableHudWidgetEntry,
  type SymbolTableLoadoutEntry,
  type SymbolTableLoadoutPaletteEntry,
  type SymbolTableObjectListItemEntry,
  type SymbolTableRequisitionPaletteEntry,
  type SymbolTableStringEntry,
  type SymbolTableVariableEntry,
} from "../../frontend/symbol-table";
import { Lexer, type Token, TokenKind } from "../../frontend/tokens/index";
import { MEGALO_VERSIONS } from "../../version";
import type {
  AnalyzeRequest,
  AnalyzeResponse,
  SaveGametypeRequest,
  SaveGametypeResponse,
  WorkerRequest,
  WorkerResponse,
} from "./analyze.types";

const MEGALO_VERSION = MEGALO_VERSIONS["107-mcc"];
const lexer = new Lexer(MEGALO_VERSION);
const parser = new Parser(MEGALO_VERSION);
const lowerer = new Lowerer(MEGALO_VERSION);
const compiler = getCompilerForVersion(MEGALO_VERSION);

const formatTokens = (tokens: Token[]): unknown =>
  tokens.map((token) => ({
    kind: TokenKind[token.kind] ?? token.kind,
    value: token.value,
    location: token.location,
  }));

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
    case SymbolKind.Loadout:
      return "Loadout";
    case SymbolKind.LoadoutPalette:
      return "LoadoutPalette";
    case SymbolKind.RequisitionPalette:
      return "RequisitionPalette";
    case SymbolKind.ObjectListItem:
      return "ObjectListItem";
  }
};

const serializeSymbolTableEntry = (entry: SymbolTableEntry): object => {
  const base = {
    id: entry.id,
    name: entry.name,
    kind: symbolKindName(entry.kind),
    range: entry.range,
    references: entry.references,
  };

  switch (entry.kind) {
    case SymbolKind.String: {
      const stringEntry = entry as SymbolTableStringEntry;
      return {
        ...base,
        languageDeclarations: Object.entries(
          stringEntry.languageDeclarations
        ).map(([language, declaration]) => ({ language, declaration })),
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
    case SymbolKind.Loadout: {
      const loadoutEntry = entry as SymbolTableLoadoutEntry;
      return {
        ...base,
        declaration: loadoutEntry.declaration,
      };
    }
    case SymbolKind.LoadoutPalette: {
      const loadoutPaletteEntry = entry as SymbolTableLoadoutPaletteEntry;
      return {
        ...base,
        declaration: loadoutPaletteEntry.declaration,
      };
    }
    case SymbolKind.RequisitionPalette: {
      const requisitionPaletteEntry =
        entry as SymbolTableRequisitionPaletteEntry;
      return {
        ...base,
        declaration: requisitionPaletteEntry.declaration,
      };
    }
    case SymbolKind.ObjectListItem: {
      const objectListItemEntry = entry as SymbolTableObjectListItemEntry;
      return {
        ...base,
        objectType: objectListItemEntry.objectType,
        index: objectListItemEntry.index,
        declaration: objectListItemEntry.declaration,
      };
    }
  }

  return base;
};

const formatSymbolTable = (symbolTable: SymbolTable): unknown =>
  symbolTable.toArray().map(serializeSymbolTableEntry);

const jsonReplacer = (_key: string, value: unknown): unknown =>
  typeof value === "bigint" ? value.toString() : value;

/** Structured-clone-safe plain JSON (Maps / bigints / etc. normalized). */
const toPlainJson = (value: unknown): unknown =>
  JSON.parse(JSON.stringify(value, jsonReplacer));

const analyze = (request: AnalyzeRequest): AnalyzeResponse => {
  const { id, source, locale, objectLists } = request;

  setLocale(locale);

  const diagnostics = new Diagnostics();

  const lexStart = performance.now();
  const tokens = lexer.lex(source, diagnostics);
  const lexDuration = performance.now() - lexStart;

  const parseStart = performance.now();
  const ast = parser.parse(tokens, diagnostics, objectLists);
  const parseDuration = performance.now() - parseStart;

  const lowerStart = performance.now();
  const ir = lowerer.lower(ast, diagnostics, { objectLists });
  const lowerDuration = performance.now() - lowerStart;

  try {
    compiler.dryRun(ir, diagnostics);
  } catch (error) {
    console.error("Compile dry run failed", error);
  }

  return {
    type: "analyze",
    id,
    tokens: formatTokens(tokens),
    ast: toPlainJson(ast),
    symbolTable: formatSymbolTable(ast.symbolTable),
    ir: toPlainJson(ir),
    tokenCount: tokens.length,
    symbolCount: ast.symbolTable.toArray().length,
    lexDuration,
    parseDuration,
    lowerDuration,
    diagnostics: [...diagnostics.getErrors(), ...diagnostics.getWarnings()],
  };
};

const saveGametype = (request: SaveGametypeRequest): SaveGametypeResponse => {
  const { id, source, locale, objectLists } = request;

  setLocale(locale);

  const diagnostics = new Diagnostics();

  try {
    const tokens = lexer.lex(source, diagnostics);
    const ast = parser.parse(tokens, diagnostics, objectLists);
    const ir = lowerer.lower(ast, diagnostics, { objectLists });
    const bytes = compiler.writeMegaloFile(ir, diagnostics);
    const data = bytes.buffer.slice(
      bytes.byteOffset,
      bytes.byteOffset + bytes.byteLength
    ) as ArrayBuffer;

    return {
      type: "saveGametype",
      id,
      data,
      diagnostics: [...diagnostics.getErrors(), ...diagnostics.getWarnings()],
    };
  } catch (error) {
    return {
      type: "saveGametype",
      id,
      error: error instanceof Error ? error.message : String(error),
      diagnostics: [...diagnostics.getErrors(), ...diagnostics.getWarnings()],
    };
  }
};

self.onmessage = (event: MessageEvent<WorkerRequest>): void => {
  const request = event.data;
  let response: WorkerResponse;

  if (request.type === "saveGametype") {
    response = saveGametype(request);
    if (response.data !== undefined) {
      self.postMessage(response, [response.data]);
      return;
    }
  } else {
    response = analyze(request);
  }

  self.postMessage(response);
};
