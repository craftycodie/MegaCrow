import {
  isObjectListDiagnosticData,
  type ObjectListDiagnosticData,
} from "@megacrow/megalo";

export interface MegaloObjectListTarget {
  /** Absolute path when known; otherwise resolve via workspace + objectType. */
  file?: string;
  /** 1-based line in the object list file. */
  line: number;
  objectType: string;
}

export interface MegaloDiagnostic {
  column: number;
  endColumn?: number;
  /** Inclusive end line (1-based). Defaults to `line` when omitted. */
  endLine?: number;
  length?: number;
  line: number;
  message: string;
  /**
   * Jump target in an object-list `.txt` (not a span in the open Megalo
   * document). Suppresses editor markers and Ln/Col chrome.
   */
  objectList?: MegaloObjectListTarget;
  offset?: number;
  severity?: "error" | "warning";
  /**
   * No attributable source span (`UnknownLocation` / built-in). Show in the
   * problems tray only — never as an editor marker, and not navigable.
   */
  trayOnly?: boolean;
}

/** Map an LSP diagnostic (optionally carrying object-list `data`) into IDE form. */
export function megaloDiagnosticFromLsp(d: {
  message: string;
  range: {
    end: { character: number; line: number };
    start: { character: number; line: number };
  };
  severity?: number;
  data?: unknown;
}): MegaloDiagnostic {
  const severity = d.severity === 1 ? ("error" as const) : ("warning" as const);
  if (isObjectListDiagnosticData(d.data)) {
    const data: ObjectListDiagnosticData = d.data;
    return {
      line: 0,
      column: 0,
      message: d.message,
      severity,
      objectList: {
        objectType: data.objectType,
        line: data.line0 + 1,
        ...(data.file === undefined ? {} : { file: data.file }),
      },
    };
  }

  const startLine = d.range.start.line;
  const startCol = d.range.start.character;
  const isPlaceholderSpan = startLine === 0 && startCol === 0;
  // Built-in / unknown LSP placeholders use 0:0 with no object-list data.
  if (
    isPlaceholderSpan &&
    d.range.end.line === 0 &&
    d.range.end.character === 0
  ) {
    return {
      line: 0,
      column: 0,
      message: d.message,
      severity,
      trayOnly: true,
    };
  }

  return {
    line: startLine + 1,
    column: startCol + 1,
    endLine: d.range.end.line + 1,
    endColumn: d.range.end.character + 1,
    message: d.message,
    severity,
  };
}

export function diagnosticHasEditorSpan(d: MegaloDiagnostic): boolean {
  return !(d.trayOnly || d.objectList);
}

export function diagnosticCanNavigate(d: MegaloDiagnostic): boolean {
  return diagnosticHasEditorSpan(d) || d.objectList !== undefined;
}

export function objectListDisplayName(target: MegaloObjectListTarget): string {
  if (target.file) {
    const normalized = target.file.replace(/\\/g, "/");
    const parts = normalized.split("/");
    return parts.at(-1) || target.file;
  }
  return `${target.objectType}.txt`;
}
