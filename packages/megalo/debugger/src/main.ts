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

const LOCALE_STORAGE_KEY = "megalo-debugger-locale";

const NYI = "Not yet implemented.";

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
      <pre class="diagnostics-list" data-role="diagnostics"></pre>
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

const formatDiagnosticsText = (diagnostics: Diagnostic[]): string => {
  const items = sortDiagnostics(diagnostics);
  if (items.length === 0) {
    return "No diagnostics.";
  }

  const visible = items.slice(0, MAX_DISPLAYED_DIAGNOSTICS);
  const lines = visible.map(
    (diagnostic) =>
      `${severityLabel(diagnostic.severity).padEnd(7)} ${formatDiagnosticLocation(diagnostic).padEnd(8)} ${diagnostic.message}`,
  );

  if (items.length > MAX_DISPLAYED_DIAGNOSTICS) {
    lines.push(
      `... ${items.length - MAX_DISPLAYED_DIAGNOSTICS} more diagnostic${items.length - MAX_DISPLAYED_DIAGNOSTICS === 1 ? "" : "s"}`,
    );
  }

  return lines.join("\n");
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

const setTextIfChanged = (element: HTMLElement, nextText: string, cache: { value: string | null }): void => {
  if (cache.value === nextText) {
    return;
  }

  element.replaceChildren(document.createTextNode(nextText));
  cache.value = nextText;
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

let cachedSource: string | null = null;
let cachedTokensText: { value: string | null } = { value: null };
let cachedAstText: { value: string | null } = { value: null };
let cachedDiagnosticsText: { value: string | null } = { value: null };
let cachedDiagnosticsSummary: { value: string | null } = { value: null };

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
        setTextIfChanged(tokensView, result.tokensText, cachedTokensText);
      }
    },
    () => {
      if (!latestResult || latestResult.id !== updateGeneration) {
        return;
      }

      if (!options.diagnosticsOnly || sourceChanged) {
        setTextIfChanged(astView, result.astText, cachedAstText);
        astView.classList.remove("placeholder");
      }
    },
    () => {
      if (!latestResult || latestResult.id !== updateGeneration) {
        return;
      }

      const diagnosticsText = formatDiagnosticsText(result.diagnostics);
      setTextIfChanged(diagnosticsView, diagnosticsText, cachedDiagnosticsText);

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
  const source = sourceEditor.value;
  pendingOptions = options;
  pendingSourceChanged = source !== cachedSource;
  cachedSource = source;

  const request: AnalyzeRequest = {
    id: generation,
    source,
    locale: getLocale(),
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

sourceEditor.addEventListener("input", () => {
  markSourceEditorActive();
  scheduleUpdate();
});

sourceEditor.addEventListener("keydown", () => {
  markSourceEditorActive();
});

sourceEditor.addEventListener("mousedown", () => {
  markSourceEditorActive();
});

const storedLocale = localStorage.getItem(LOCALE_STORAGE_KEY);
const initialLocale: SupportedLocale =
  storedLocale === "en" || storedLocale === "ja" ? storedLocale : "en";

applyLocale(initialLocale);
