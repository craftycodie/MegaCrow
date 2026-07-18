import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";
import "monaco-editor/min/vs/editor/editor.main.css";
import {
  type Diagnostic,
  DiagnosticSeverity,
  SourceLocationType,
} from "../../frontend/diagnostics";

self.MonacoEnvironment = {
  getWorker() {
    return new editorWorker();
  },
};

const MARKER_OWNER = "megalo";

const severityToMarker = (
  severity: DiagnosticSeverity
): monaco.MarkerSeverity => {
  switch (severity) {
    case DiagnosticSeverity.Warning:
      return monaco.MarkerSeverity.Warning;
    case DiagnosticSeverity.Info:
      return monaco.MarkerSeverity.Info;
    case DiagnosticSeverity.Error:
    default:
      return monaco.MarkerSeverity.Error;
  }
};

const diagnosticToMarker = (
  model: monaco.editor.ITextModel,
  diagnostic: Diagnostic
): monaco.editor.IMarkerData | undefined => {
  if (diagnostic.location.type !== SourceLocationType.SOURCE_CODE) {
    return;
  }

  const { start, end } = diagnostic.location;
  const valueLength = model.getValueLength();
  const startOffset = Math.min(Math.max(0, start.offset), valueLength);
  const endOffset = Math.min(Math.max(startOffset, end.offset), valueLength);

  if (endOffset > startOffset) {
    const startPos = model.getPositionAt(startOffset);
    const endPos = model.getPositionAt(endOffset);
    return {
      severity: severityToMarker(diagnostic.severity),
      startLineNumber: startPos.lineNumber,
      startColumn: startPos.column,
      endLineNumber: endPos.lineNumber,
      endColumn: Math.max(endPos.column, startPos.column + 1),
      message: diagnostic.message,
      source: "megalo",
    };
  }

  const lineCount = model.getLineCount();
  const startLine = Math.min(Math.max(1, start.line), lineCount);
  const lineLength = model.getLineLength(startLine);
  const startColumn = Math.min(Math.max(1, start.column), lineLength + 1);
  const endLine = Math.min(Math.max(startLine, end.line), lineCount);
  const endLineLength = model.getLineLength(endLine);
  const endColumn = Math.min(
    Math.max(end.column, startColumn + 1),
    endLineLength + 1
  );

  return {
    severity: severityToMarker(diagnostic.severity),
    startLineNumber: startLine,
    startColumn,
    endLineNumber: endLine,
    endColumn,
    message: diagnostic.message,
    source: "megalo",
  };
};

export type SourceEditor = {
  getValue: () => string;
  setDiagnostics: (diagnostics: Diagnostic[]) => void;
  revealDiagnostic: (diagnostic: Diagnostic) => void;
  onDidChangeContent: (listener: () => void) => monaco.IDisposable;
  onDidInteract: (listener: () => void) => void;
  layout: () => void;
  dispose: () => void;
};

export const createSourceEditor = (
  container: HTMLElement,
  initialValue: string
): SourceEditor => {
  const editor = monaco.editor.create(container, {
    value: initialValue,
    language: "plaintext",
    theme: "vs-dark",
    automaticLayout: true,
    minimap: { enabled: false },
    lineNumbers: "on",
    glyphMargin: true,
    folding: true,
    renderLineHighlight: "line",
    scrollBeyondLastLine: false,
    wordWrap: "off",
    fontFamily: 'Consolas, "Courier New", monospace',
    fontSize: 13,
    lineHeight: 20,
    padding: { top: 8, bottom: 8 },
    tabSize: 4,
    insertSpaces: false,
    renderWhitespace: "none",
    overviewRulerLanes: 2,
    fixedOverflowWidgets: true,
  });

  const model = editor.getModel();
  if (!model) {
    throw new Error("Monaco source editor failed to create a model.");
  }

  return {
    getValue: () => editor.getValue(),
    setDiagnostics: (diagnostics) => {
      monaco.editor.setModelMarkers(
        model,
        MARKER_OWNER,
        diagnostics.flatMap((diagnostic) => {
          const marker = diagnosticToMarker(model, diagnostic);
          return marker === undefined ? [] : [marker];
        })
      );
    },
    revealDiagnostic: (diagnostic) => {
      const marker = diagnosticToMarker(model, diagnostic);
      if (marker === undefined) {
        return;
      }
      editor.revealLineInCenter(marker.startLineNumber);
      editor.setPosition({
        lineNumber: marker.startLineNumber,
        column: marker.startColumn,
      });
      editor.focus();
    },
    onDidChangeContent: (listener) =>
      editor.onDidChangeModelContent(() => {
        listener();
      }),
    onDidInteract: (listener) => {
      editor.onKeyDown(() => {
        listener();
      });
      editor.onMouseDown(() => {
        listener();
      });
    },
    layout: () => {
      editor.layout();
    },
    dispose: () => {
      editor.dispose();
    },
  };
};
