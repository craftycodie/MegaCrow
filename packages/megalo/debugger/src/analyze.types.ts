import type { Diagnostic } from "../../frontend/diagnostics";
import type { SupportedLocale } from "../../frontend/localization";
import type { ObjectLists } from "../../frontend/object-lists";

export type AnalyzeRequest = {
  type: "analyze";
  id: number;
  source: string;
  locale: SupportedLocale;
  objectLists: ObjectLists;
};

export type AnalyzeResponse = {
  type: "analyze";
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

export type SaveGametypeRequest = {
  type: "saveGametype";
  id: number;
  source: string;
  locale: SupportedLocale;
  objectLists: ObjectLists;
};

export type SaveGametypeResponse = {
  type: "saveGametype";
  id: number;
  data?: ArrayBuffer;
  error?: string;
  diagnostics: Diagnostic[];
};

export type WorkerRequest = AnalyzeRequest | SaveGametypeRequest;
export type WorkerResponse = AnalyzeResponse | SaveGametypeResponse;
