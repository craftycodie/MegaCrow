export interface MegaloIncludeError {
  column: number;
  length?: number;
  line: number;
  message: string;
  offset?: number;
  path: string;
}

export interface MegaloCompileOptions {
  creatorGamertag?: string;
  includes?: {
    inputDir?: string;
    sourceDir?: string;
    outputDir?: string;
    readFile?: (path: string) => string | Promise<string>;
    exists?: (path: string) => boolean | Promise<boolean>;
  };
  strictStringLiterals?: boolean;
}

export function sourceHasIncludeDirectives(source: string): boolean {
  return /^\s*(include|localized_include)\s+"/m.test(source);
}

export function findMegaloIncludeDirectives(source: string): string[] {
  const paths: string[] = [];
  const re = /^\s*(?:include|localized_include)\s+"([^"]+)"/gm;
  for (const match of source.matchAll(re)) {
    if (match[1]) {
      paths.push(match[1]);
    }
  }
  return paths;
}

export function unresolvedIncludeErrors(
  source: string,
  message: string
): MegaloIncludeError[] {
  const errors: MegaloIncludeError[] = [];
  const lines = source.split(/\r?\n/);
  const re = /^\s*(include|localized_include)\s+"([^"]*)"/;
  for (let i = 0; i < lines.length; i++) {
    const match = re.exec(lines[i] ?? "");
    if (!match) {
      continue;
    }
    errors.push({
      path: match[2] ?? "",
      message,
      line: i + 1,
      column: 1,
    });
  }
  if (errors.length === 0) {
    errors.push({
      path: "",
      message,
      line: 1,
      column: 1,
    });
  }
  return errors;
}

/**
 * Include expansion is handled by `compileSource` / LSP `resolveInclude`.
 * This remains a pass-through for callers that only need a compile-options shape.
 */
export function tryExpandMegaloIncludes(
  source: string,
  _options?: MegaloCompileOptions
): { ok: true; source: string } | { ok: false; errors: MegaloIncludeError[] } {
  return { ok: true, source };
}
