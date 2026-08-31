/** A quoted path on an `include` / `localized_include` / `base` directive. */
export type PathReferenceKind = "include" | "localized_include" | "base";

export interface PathReference {
  kind: PathReferenceKind;
  /** Path text inside the quotes. */
  path: string;
  /** 1-based Monaco range covering the quoted path (including quotes). */
  range: {
    startLineNumber: number;
    startColumn: number;
    endLineNumber: number;
    endColumn: number;
  };
}

const PATH_DIRECTIVE_RE = /^\s*(include|localized_include|base)\s+("([^"]*)")/i;

/**
 * Find `include` / `localized_include` / `base` quoted paths in source text.
 */
export function findPathReferences(source: string): PathReference[] {
  const references: PathReference[] = [];
  const lines = source.split(/\r?\n/);
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i] ?? "";
    const match = PATH_DIRECTIVE_RE.exec(line);
    if (!match?.[1] || match[2] === undefined || match[3] === undefined) {
      continue;
    }
    const kind = match[1].toLowerCase() as PathReferenceKind;
    const quoted = match[2];
    const path = match[3];
    if (!path) {
      continue;
    }
    const quotedStart = line.indexOf(quoted);
    if (quotedStart < 0) {
      continue;
    }
    references.push({
      kind,
      path,
      range: {
        startLineNumber: i + 1,
        startColumn: quotedStart + 1,
        endLineNumber: i + 1,
        endColumn: quotedStart + quoted.length + 1,
      },
    });
  }
  return references;
}
