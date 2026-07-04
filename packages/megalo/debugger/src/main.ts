import { Lexer, TokenKind, type Token } from "../../frontend/tokens/index";
import { Parser } from "../../frontend/abstract-syntax-tree/index";
import { MEGALO_VERSIONS } from "../../version";
import { DEFAULT_SOURCE } from "./example";
import "./styles.css";
import {
  DiagnosticSeverity,
  Diagnostics,
  type Diagnostic,
} from "../../frontend/diagnostics";
import {
  getLocale,
  setLocale,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "../../frontend/localization";

const LOCALE_STORAGE_KEY = "megalo-debugger-locale";

const NYI = "Not yet implemented.";

const formatToken = (token: Token) => ({
  kind: TokenKind[token.kind] ?? token.kind,
  value: token.value,
  location: token.location,
});

const formatTokens = (tokens: Token[]) =>
  JSON.stringify(tokens.map(formatToken), null, 2);

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("Missing #app root element.");
}

app.innerHTML = `
  <div class="app">
    <header class="toolbar">
      <h1>Megalo Debugger</h1>
      <div
        class="locale-toggle"
        data-role="locale-toggle"
        role="group"
        aria-label="Language"
      >
        <button type="button" class="locale-toggle-button" data-locale="en">EN</button>
        <button type="button" class="locale-toggle-button" data-locale="ja">JA</button>
      </div>
      <span class="toolbar-status" data-role="token-count"></span>
      <span class="toolbar-status" data-role="total-time"></span>
    </header>
    <div class="panes">
      <section class="pane">
        <div class="pane-header">Source</div>
        <textarea class="source-editor" spellcheck="false"></textarea>
      </section>
      <section class="pane">
        <div class="pane-header">
          Tokens
          <span class="pane-header-meta" data-role="token-time"></span>
        </div>
        <pre class="output-view" data-role="tokens"></pre>
      </section>
      <section class="pane">
        <div class="pane-header">AST
          <span class="pane-header-meta" data-role="ast-time"></span>
        </div>
        <pre class="output-view" data-role="ast"></pre>
      </section>
      <section class="pane">
        <div class="pane-header">IR</div>
        <pre class="output-view placeholder" data-role="ir"></pre>
      </section>
    </div>
    <section class="diagnostics-panel">
      <div class="pane-header">
        Diagnostics
        <span class="pane-header-meta" data-role="diagnostics-count"></span>
      </div>
      <ul class="diagnostics-list" data-role="diagnostics"></ul>
    </section>
  </div>
`;

const sourceEditor = app.querySelector<HTMLTextAreaElement>(".source-editor");
const tokensView = app.querySelector<HTMLElement>('[data-role="tokens"]');
const astView = app.querySelector<HTMLElement>('[data-role="ast"]');
const astTime = app.querySelector<HTMLElement>('[data-role="ast-time"]');
const irView = app.querySelector<HTMLElement>('[data-role="ir"]');
const tokenCount = app.querySelector<HTMLElement>('[data-role="token-count"]');
const tokenTime = app.querySelector<HTMLElement>('[data-role="token-time"]');
const totalTime = app.querySelector<HTMLElement>('[data-role="total-time"]');
const diagnosticsView = app.querySelector<HTMLElement>('[data-role="diagnostics"]');
const diagnosticsCount = app.querySelector<HTMLElement>(
  '[data-role="diagnostics-count"]',
);
const localeToggle = app.querySelector<HTMLElement>('[data-role="locale-toggle"]');

if (
  !sourceEditor ||
  !tokensView ||
  !astView ||
  !irView ||
  !tokenCount ||
  !tokenTime ||
  !astTime ||
  !totalTime ||
  !diagnosticsView ||
  !diagnosticsCount ||
  !localeToggle
) {
  throw new Error("Debugger layout failed to initialize.");
}

const localeButtons = localeToggle.querySelectorAll<HTMLButtonElement>("[data-locale]");

sourceEditor.value = DEFAULT_SOURCE;
irView.textContent = NYI;

const severityLabel = (severity: DiagnosticSeverity): string =>
  DiagnosticSeverity[severity] ?? String(severity);

const formatDiagnosticLocation = (diagnostic: Diagnostic): string => {
  const { line, column } = diagnostic.location.start;
  return `${line}:${column}`;
};

const renderDiagnostics = (diagnostics: Diagnostics): void => {
  const items = [
    ...diagnostics.getErrors(),
    ...diagnostics.getWarnings(),
  ].sort(
    (left, right) =>
      left.location.start.offset - right.location.start.offset ||
      left.location.start.line - right.location.start.line ||
      left.location.start.column - right.location.start.column,
  );

  diagnosticsView.replaceChildren();

  if (items.length === 0) {
    diagnosticsCount.textContent = "none";
    const empty = document.createElement("li");
    empty.className = "diagnostics-empty";
    empty.textContent = "No diagnostics.";
    diagnosticsView.append(empty);
    return;
  }

  const errorCount = diagnostics.getErrors().length;
  const warningCount = diagnostics.getWarnings().length;
  const parts: string[] = [];
  if (errorCount > 0) {
    parts.push(`${errorCount} error${errorCount === 1 ? "" : "s"}`);
  }
  if (warningCount > 0) {
    parts.push(`${warningCount} warning${warningCount === 1 ? "" : "s"}`);
  }
  diagnosticsCount.textContent = parts.join(", ");

  for (const diagnostic of items) {
    const item = document.createElement("li");
    item.className = `diagnostic diagnostic-${severityLabel(diagnostic.severity).toLowerCase()}`;

    const severity = document.createElement("span");
    severity.className = "diagnostic-severity";
    severity.textContent = severityLabel(diagnostic.severity);

    const location = document.createElement("span");
    location.className = "diagnostic-location";
    location.textContent = formatDiagnosticLocation(diagnostic);

    const message = document.createElement("span");
    message.className = "diagnostic-message";
    message.textContent = diagnostic.message;

    item.append(severity, location, message);
    diagnosticsView.append(item);
  }
};

const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 1) {
    return `${(milliseconds * 1000).toFixed(0)} µs`;
  }
  if (milliseconds < 10) {
    return `${milliseconds.toFixed(2)} ms`;
  }
  return `${milliseconds.toFixed(1)} ms`;
};

const MEGALO_VERSION = MEGALO_VERSIONS["107-mcc"];
const lexer = new Lexer(MEGALO_VERSION);
const parser = new Parser(MEGALO_VERSION);

let cachedSource: string | null = null;
let cachedTokens: Token[] | null = null;
let cachedLexDuration = 0;

type UpdateOptions = {
  /** Re-translate diagnostics without re-rendering tokens/AST panes. */
  diagnosticsOnly?: boolean;
};

const update = (options: UpdateOptions = {}) => {
  const diagnostics = new Diagnostics();
  const source = sourceEditor.value;
  const sourceChanged = source !== cachedSource;

  let tokens: Token[];
  let lexDuration: number;

  if (options.diagnosticsOnly && !sourceChanged && cachedTokens) {
    tokens = cachedTokens;
    lexDuration = cachedLexDuration;
  } else {
    const lexStart = performance.now();
    tokens = lexer.lex(source, diagnostics);
    lexDuration = performance.now() - lexStart;

    cachedSource = source;
    cachedTokens = tokens;
    cachedLexDuration = lexDuration;

    tokensView.textContent = formatTokens(tokens);
    tokenCount.textContent = `${tokens.length} token${tokens.length === 1 ? "" : "s"}`;
    tokenTime.textContent = formatDuration(lexDuration);
  }

  const parseStart = performance.now();
  const ast = parser.parse(tokens, diagnostics);
  const parseDuration = performance.now() - parseStart;

  if (!options.diagnosticsOnly || sourceChanged) {
    astView.textContent = JSON.stringify(ast, null, 2);
    astView.classList.remove("placeholder");
    astTime.textContent = formatDuration(parseDuration);

    totalTime.textContent = formatDuration(lexDuration + parseDuration);
  }

  renderDiagnostics(diagnostics);
};

const syncLocaleToggle = (locale: SupportedLocale): void => {
  for (const button of localeButtons) {
    button.classList.toggle("is-active", button.dataset.locale === locale);
  }
};

const applyLocale = (locale: SupportedLocale): void => {
  setLocale(locale);
  syncLocaleToggle(locale);
  localStorage.setItem(LOCALE_STORAGE_KEY, locale);
  update({ diagnosticsOnly: true });
};

for (const button of localeButtons) {
  button.addEventListener("click", () => {
    const locale = button.dataset.locale;
    if (!locale || !SUPPORTED_LOCALES.includes(locale as SupportedLocale)) {
      return;
    }

    if (locale !== getLocale()) {
      applyLocale(locale as SupportedLocale);
    }
  });
}

sourceEditor.addEventListener("input", () => update());

const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
const initialLocale: SupportedLocale =
  storedLocale === "en" || storedLocale === "ja" ? storedLocale : "en";

applyLocale(initialLocale);
