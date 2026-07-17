import { DEFAULT_SOURCE } from "./example";
import "./styles.css";
import {
  DiagnosticSeverity,
  type Diagnostic,
} from "../../frontend/diagnostics";
import {
  getLocale,
  setLocale,
  SUPPORTED_LOCALES,
  type SupportedLocale,
} from "../../frontend/localization";
import type { AnalyzeRequest, AnalyzeResponse } from "./analyze.types";
import AnalyzeWorker from "./analyze.worker.ts?worker";
import { loadObjectLists } from "./object-lists";
import { renderJsonTree } from "./json-tree";
import { createSourceEditor } from "./source-editor";
import type { ObjectLists } from "../../frontend/object-lists";

const LOCALE_STORAGE_KEY = "megalo-debugger-locale";

const PARSE_DEBOUNCE_MS = 150;
const DOM_DEBOUNCE_MS = 400;
const SOURCE_SETTLE_MS = 250;
const MAX_DISPLAYED_DIAGNOSTICS = 200;

const app = document.querySelector<HTMLDivElement>("#app");
if (!app) {
  throw new Error("Missing #app root element.");
}

app.innerHTML = `
  <div class="app">
    <header class="toolbar">
      <h1>Megalo Debugger</h1>
      <a class="toolbar-link" href="/inspector">Inspector</a>
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
    <div class="workspace">
      <div class="panes">
        <section class="pane">
          <div class="pane-header">Source</div>
          <div class="source-editor" data-role="source-editor"></div>
        </section>
        <section class="pane">
          <div class="pane-header">
            Tokens
            <span class="pane-header-meta" data-role="token-time"></span>
          </div>
          <div class="output-view json-tree" data-role="tokens"></div>
        </section>
        <section class="pane">
          <div class="pane-header">AST
            <span class="pane-header-meta" data-role="ast-time"></span>
          </div>
          <div class="output-view json-tree" data-role="ast"></div>
        </section>
        <section class="pane">
          <div class="pane-header">IR
            <span class="pane-header-meta" data-role="ir-time"></span>
          </div>
          <div class="output-view json-tree" data-role="ir"></div>
        </section>
      </div>
      <section class="pane pane-symbols">
        <div class="pane-header">
          Symbol Table
          <span class="pane-header-meta" data-role="symbol-count"></span>
        </div>
        <div class="output-view json-tree" data-role="symbols"></div>
      </section>
    </div>
    <section class="diagnostics-panel">
      <div class="pane-header">
        Diagnostics
        <span class="pane-header-meta" data-role="diagnostics-count"></span>
      </div>
      <div class="diagnostics-list" data-role="diagnostics"></div>
    </section>
  </div>
`;

const sourceEditorHost = app.querySelector<HTMLElement>('[data-role="source-editor"]');
const tokensView = app.querySelector<HTMLElement>('[data-role="tokens"]');
const astView = app.querySelector<HTMLElement>('[data-role="ast"]');
const astTime = app.querySelector<HTMLElement>('[data-role="ast-time"]');
const irView = app.querySelector<HTMLElement>('[data-role="ir"]');
const irTime = app.querySelector<HTMLElement>('[data-role="ir-time"]');
const symbolsView = app.querySelector<HTMLElement>('[data-role="symbols"]');
const symbolCount = app.querySelector<HTMLElement>('[data-role="symbol-count"]');
const tokenCount = app.querySelector<HTMLElement>('[data-role="token-count"]');
const tokenTime = app.querySelector<HTMLElement>('[data-role="token-time"]');
const totalTime = app.querySelector<HTMLElement>('[data-role="total-time"]');
const diagnosticsView = app.querySelector<HTMLElement>('[data-role="diagnostics"]');
const diagnosticsCount = app.querySelector<HTMLElement>(
  '[data-role="diagnostics-count"]',
);
const localeToggle = app.querySelector<HTMLElement>('[data-role="locale-toggle"]');

if (
  !sourceEditorHost ||
  !tokensView ||
  !astView ||
  !irView ||
  !irTime ||
  !symbolsView ||
  !symbolCount ||
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
const sourceEditor = createSourceEditor(sourceEditorHost, DEFAULT_SOURCE);

const severityLabel = (severity: DiagnosticSeverity): string =>
  DiagnosticSeverity[severity] ?? String(severity);

const formatDiagnosticLocation = (diagnostic: Diagnostic): string => {
  const { line, column } = diagnostic.location.start;
  return `${line}:${column}`;
};

const sortDiagnostics = (diagnostics: Diagnostic[]): Diagnostic[] =>
  [...diagnostics].sort(
    (left, right) =>
      left.location.start.offset - right.location.start.offset ||
      left.location.start.line - right.location.start.line ||
      left.location.start.column - right.location.start.column,
  );

const formatDiagnosticsSummary = (diagnostics: Diagnostic[]): string => {
  const errorCount = diagnostics.filter(
    (diagnostic) => diagnostic.severity === DiagnosticSeverity.Error,
  ).length;
  const warningCount = diagnostics.filter(
    (diagnostic) => diagnostic.severity === DiagnosticSeverity.Warning,
  ).length;

  if (errorCount === 0 && warningCount === 0) {
    return "none";
  }

  const parts: string[] = [];
  if (errorCount > 0) {
    parts.push(`${errorCount} error${errorCount === 1 ? "" : "s"}`);
  }
  if (warningCount > 0) {
    parts.push(`${warningCount} warning${warningCount === 1 ? "" : "s"}`);
  }
  return parts.join(", ");
};

const renderDiagnostics = (diagnostics: Diagnostic[]): void => {
  const items = sortDiagnostics(diagnostics);
  diagnosticsView.replaceChildren();

  if (items.length === 0) {
    const empty = document.createElement("div");
    empty.className = "diagnostics-empty";
    empty.textContent = "No diagnostics.";
    diagnosticsView.append(empty);
    return;
  }

  const visible = items.slice(0, MAX_DISPLAYED_DIAGNOSTICS);
  for (const diagnostic of visible) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = `diagnostics-item severity-${severityLabel(diagnostic.severity).toLowerCase()}`;
    button.textContent = `${severityLabel(diagnostic.severity).padEnd(7)} ${formatDiagnosticLocation(diagnostic).padEnd(8)} ${diagnostic.message}`;
    button.addEventListener("click", () => {
      sourceEditor.revealDiagnostic(diagnostic);
    });
    diagnosticsView.append(button);
  }

  if (items.length > MAX_DISPLAYED_DIAGNOSTICS) {
    const more = document.createElement("div");
    more.className = "diagnostics-more";
    more.textContent = `... ${items.length - MAX_DISPLAYED_DIAGNOSTICS} more diagnostic${items.length - MAX_DISPLAYED_DIAGNOSTICS === 1 ? "" : "s"}`;
    diagnosticsView.append(more);
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

const setTreeIfChanged = (
  element: HTMLElement,
  value: unknown,
  cache: { signature: string | null },
): void => {
  const signature = JSON.stringify(value);
  if (cache.signature === signature) {
    return;
  }

  renderJsonTree(element, value);
  cache.signature = signature;
};

const scheduleIdle = (callback: () => void, timeout: number): void => {
  if ("requestIdleCallback" in window) {
    requestIdleCallback(callback, { timeout });
    return;
  }

  requestAnimationFrame(callback);
};

const scheduleIdleChain = (steps: Array<() => void>, timeout: number): void => {
  const runStep = (index: number): void => {
    if (index >= steps.length) {
      return;
    }

    scheduleIdle(() => {
      steps[index]!();
      runStep(index + 1);
    }, timeout);
  };

  runStep(0);
};

const analyzeWorker = new AnalyzeWorker();

let objectLists: ObjectLists = {};

let cachedSource: string | null = null;
let cachedTokens: { signature: string | null } = { signature: null };
let cachedAst: { signature: string | null } = { signature: null };
let cachedIr: { signature: string | null } = { signature: null };
let cachedSymbolTable: { signature: string | null } = { signature: null };
let cachedDiagnosticsSummary: { value: string | null } = { value: null };
let cachedDiagnosticsSignature: string | null = null;

let updateGeneration = 0;
let parseDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let domDebounceTimer: ReturnType<typeof setTimeout> | null = null;
let sourceSettleTimer: ReturnType<typeof setTimeout> | null = null;
let latestResult: AnalyzeResponse | null = null;
let sourceEditorActive = false;
let domFlushPending = false;

type UpdateOptions = {
  /** Re-translate diagnostics without re-rendering tokens/AST panes. */
  diagnosticsOnly?: boolean;
  /** Skip debounce for initial load and locale changes. */
  immediate?: boolean;
};

let pendingOptions: UpdateOptions = {};
let pendingSourceChanged = false;

const setSourceEditorActive = (active: boolean): void => {
  sourceEditorActive = active;
  app.classList.toggle("is-editing-source", active);
};

const markSourceEditorActive = (): void => {
  setSourceEditorActive(true);
  cancelDomFlush();

  if (sourceSettleTimer !== null) {
    clearTimeout(sourceSettleTimer);
  }

  sourceSettleTimer = setTimeout(() => {
    sourceSettleTimer = null;
    setSourceEditorActive(false);

    if (domFlushPending) {
      domFlushPending = false;
      scheduleDomFlush();
    }
  }, SOURCE_SETTLE_MS);
};

const diagnosticsSignature = (diagnostics: Diagnostic[]): string =>
  diagnostics
    .map(
      (diagnostic) =>
        `${diagnostic.severity}:${diagnostic.location.start.offset}:${diagnostic.location.end.offset}:${diagnostic.message}`,
    )
    .join("\n");

const flushDom = (): void => {
  const result = latestResult;
  if (!result || result.id !== updateGeneration) {
    return;
  }

  if (sourceEditorActive) {
    domFlushPending = true;
    return;
  }

  const options = pendingOptions;
  const sourceChanged = pendingSourceChanged;

  scheduleIdleChain([
    () => {
      tokenCount.textContent = `${result.tokenCount} token${result.tokenCount === 1 ? "" : "s"}`;
      tokenTime.textContent = formatDuration(result.lexDuration);
      astTime.textContent = formatDuration(result.parseDuration);
      totalTime.textContent = formatDuration(result.lexDuration + result.parseDuration);
    },
    () => {
      if (!latestResult || latestResult.id !== updateGeneration) {
        return;
      }

      if (!options.diagnosticsOnly || sourceChanged) {
        setTreeIfChanged(tokensView, result.tokens, cachedTokens);
      }
    },
    () => {
      if (!latestResult || latestResult.id !== updateGeneration) {
        return;
      }

      if (!options.diagnosticsOnly || sourceChanged) {
        setTreeIfChanged(astView, result.ast, cachedAst);
      }
    },
    () => {
      if (!latestResult || latestResult.id !== updateGeneration) {
        return;
      }

      if (!options.diagnosticsOnly || sourceChanged) {
        setTreeIfChanged(symbolsView, result.symbolTable, cachedSymbolTable);
        symbolCount.textContent = `${result.symbolCount} symbol${result.symbolCount === 1 ? "" : "s"}`;
      }
    },
    () => {
      if (!latestResult || latestResult.id !== updateGeneration) {
        return;
      }

      if (!options.diagnosticsOnly || sourceChanged) {
        setTreeIfChanged(irView, result.ir, cachedIr);
        irTime.textContent = formatDuration(result.lowerDuration);
      }
    },
    () => {
      if (!latestResult || latestResult.id !== updateGeneration) {
        return;
      }

      const signature = diagnosticsSignature(result.diagnostics);
      if (cachedDiagnosticsSignature !== signature) {
        renderDiagnostics(result.diagnostics);
        sourceEditor.setDiagnostics(result.diagnostics);
        cachedDiagnosticsSignature = signature;
      }

      const diagnosticsSummary = formatDiagnosticsSummary(result.diagnostics);
      if (cachedDiagnosticsSummary.value !== diagnosticsSummary) {
        diagnosticsCount.textContent = diagnosticsSummary;
        cachedDiagnosticsSummary.value = diagnosticsSummary;
      }
    },
  ], 500);
};

const scheduleDomFlush = (immediate = false): void => {
  if (!immediate && sourceEditorActive) {
    domFlushPending = true;
    return;
  }

  if (domDebounceTimer !== null) {
    clearTimeout(domDebounceTimer);
    domDebounceTimer = null;
  }

  if (immediate) {
    flushDom();
    return;
  }

  domDebounceTimer = setTimeout(() => {
    domDebounceTimer = null;
    flushDom();
  }, DOM_DEBOUNCE_MS);
};

const cancelDomFlush = (): void => {
  if (domDebounceTimer !== null) {
    clearTimeout(domDebounceTimer);
    domDebounceTimer = null;
  }
};

analyzeWorker.onmessage = (event: MessageEvent<AnalyzeResponse>) => {
  if (event.data.id !== updateGeneration) {
    return;
  }

  latestResult = event.data;
  scheduleDomFlush(pendingOptions.immediate === true);
};

const runUpdate = (options: UpdateOptions = {}): void => {
  const generation = ++updateGeneration;
  const source = sourceEditor.getValue();
  pendingOptions = options;
  pendingSourceChanged = source !== cachedSource;
  cachedSource = source;

  const request: AnalyzeRequest = {
    id: generation,
    source,
    locale: getLocale(),
    objectLists,
  };

  analyzeWorker.postMessage(request);
};

const scheduleUpdate = (options: UpdateOptions = {}): void => {
  if (options.immediate) {
    if (parseDebounceTimer !== null) {
      clearTimeout(parseDebounceTimer);
      parseDebounceTimer = null;
    }
    runUpdate(options);
    return;
  }

  if (parseDebounceTimer !== null) {
    clearTimeout(parseDebounceTimer);
  }

  parseDebounceTimer = setTimeout(() => {
    parseDebounceTimer = null;
    runUpdate(options);
  }, PARSE_DEBOUNCE_MS);
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
  scheduleUpdate({ diagnosticsOnly: true, immediate: true });
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

sourceEditor.onDidChangeContent(() => {
  markSourceEditorActive();
  scheduleUpdate();
});

sourceEditor.onDidInteract(() => {
  markSourceEditorActive();
});

const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
const initialLocale: SupportedLocale =
  storedLocale === "en" || storedLocale === "ja" ? storedLocale : "en";

applyLocale(initialLocale);

objectLists = loadObjectLists("107-mcc");
scheduleUpdate({ immediate: true });
