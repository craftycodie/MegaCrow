import type { Diagnostic } from "../../frontend/diagnostics";
import type { SupportedLocale } from "../../frontend/localization";
import type { ObjectLists } from "../../frontend/object-lists";

export type AnalyzeRequest = {
  id: number;
  source: string;
  locale: SupportedLocale;
  objectLists: ObjectLists;
};

export type AnalyzeResponse = {
  id: number;
  tokens: unknown;
  ast: unknown;
  symbolTable: unknown;
  ir: unknown;
  tokenCount: number;
  symbolCount: number;
  lexDuration: number;
  parseDuration: number;
  lowerDuration: number;
  diagnostics: Diagnostic[];
};
