import { Lexer, TokenKind, type Token } from "../../frontend/tokens/index";
import { Parser } from "../../frontend/abstract-syntax-tree/index";
import { MEGALO_VERSIONS } from "../../version";
import { Diagnostics } from "../../frontend/diagnostics";
import { setLocale } from "../../frontend/localization";
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

self.onmessage = (event: MessageEvent<AnalyzeRequest>): void => {
  const { id, source, locale } = event.data;

  setLocale(locale);

  const diagnostics = new Diagnostics();

  const lexStart = performance.now();
  const tokens = lexer.lex(source, diagnostics);
  const lexDuration = performance.now() - lexStart;

  const parseStart = performance.now();
  const ast = parser.parse(tokens, diagnostics);
  const parseDuration = performance.now() - parseStart;

  const response: AnalyzeResponse = {
    id,
    tokensText: formatTokens(tokens),
    astText: JSON.stringify(ast, null, 2),
    tokenCount: tokens.length,
    lexDuration,
    parseDuration,
    diagnostics: [...diagnostics.getErrors(), ...diagnostics.getWarnings()],
  };

  self.postMessage(response);
};
