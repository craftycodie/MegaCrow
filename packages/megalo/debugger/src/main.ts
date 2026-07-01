import { lex, TokenKind, type Token } from "../../frontend/tokens/index.ts";
import { DEFAULT_SOURCE } from "./example.ts";
import "./styles.css";

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
        <div class="pane-header">AST</div>
        <pre class="output-view placeholder" data-role="ast"></pre>
      </section>
      <section class="pane">
        <div class="pane-header">IR</div>
        <pre class="output-view placeholder" data-role="ir"></pre>
      </section>
    </div>
  </div>
`;

const sourceEditor = app.querySelector<HTMLTextAreaElement>(".source-editor");
const tokensView = app.querySelector<HTMLElement>('[data-role="tokens"]');
const astView = app.querySelector<HTMLElement>('[data-role="ast"]');
const irView = app.querySelector<HTMLElement>('[data-role="ir"]');
const tokenCount = app.querySelector<HTMLElement>('[data-role="token-count"]');
const tokenTime = app.querySelector<HTMLElement>('[data-role="token-time"]');

if (
  !sourceEditor ||
  !tokensView ||
  !astView ||
  !irView ||
  !tokenCount ||
  !tokenTime
) {
  throw new Error("Debugger layout failed to initialize.");
}

sourceEditor.value = DEFAULT_SOURCE;
astView.textContent = NYI;
irView.textContent = NYI;

const formatDuration = (milliseconds: number): string => {
  if (milliseconds < 1) {
    return `${(milliseconds * 1000).toFixed(0)} µs`;
  }
  if (milliseconds < 10) {
    return `${milliseconds.toFixed(2)} ms`;
  }
  return `${milliseconds.toFixed(1)} ms`;
};

const update = () => {
  const source = sourceEditor.value;
  const start = performance.now();
  const tokens = lex(source);
  const duration = performance.now() - start;
  tokensView.textContent = formatTokens(tokens);
  tokenCount.textContent = `${tokens.length} token${tokens.length === 1 ? "" : "s"}`;
  tokenTime.textContent = formatDuration(duration);
};

sourceEditor.addEventListener("input", update);
update();
