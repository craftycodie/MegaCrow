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
        <pre class="output-view placeholder" data-role="ast"></pre>
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
  !diagnosticsCount
) {
  throw new Error("Debugger layout failed to initialize.");
}

sourceEditor.value = DEFAULT_SOURCE;
astView.textContent = NYI;
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

const update = () => {
  const diagnostics = new Diagnostics();
  const source = sourceEditor.value;

  const lexStart = performance.now();
  const tokens = lexer.lex(source, diagnostics);
  const lexDuration = performance.now() - lexStart;
  tokensView.textContent = formatTokens(tokens);
  tokenCount.textContent = `${tokens.length} token${tokens.length === 1 ? "" : "s"}`;
  tokenTime.textContent = formatDuration(lexDuration);

  const parseStart = performance.now();
  const ast = parser.parse(tokens, diagnostics);
  const parseDuration = performance.now() - parseStart;
  astView.textContent = JSON.stringify(ast, null, 2);
  astTime.textContent = formatDuration(parseDuration);

  totalTime.textContent = formatDuration(lexDuration + parseDuration);

  renderDiagnostics(diagnostics);
};

sourceEditor.addEventListener("input", update);
update();
