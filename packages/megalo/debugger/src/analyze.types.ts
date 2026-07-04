import type { Diagnostic } from "../../frontend/diagnostics";
import type { SupportedLocale } from "../../frontend/localization";

export type AnalyzeRequest = {
  id: number;
  source: string;
  locale: SupportedLocale;
};

export type AnalyzeResponse = {
  id: number;
  tokensText: string;
  astText: string;
  tokenCount: number;
  lexDuration: number;
  parseDuration: number;
  diagnostics: Diagnostic[];
};
