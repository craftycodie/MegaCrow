import { createPlatformFileProvider } from "../files/fileProvider";
import {
  isAbsoluteLogicalPath,
  joinLogicalPaths,
} from "../files/fileProvider/paths";
import { translate } from "../localization";
import type { Workspace } from "../workspace/workspace";
import type { MegaloDiagnostic } from "./diagnostics";
import type {
  MegaloCompileOptions,
  MegaloIncludeError,
} from "./megaloIncludeScan";
import type { MegaloProgram } from "./megaloProgram";

export interface MegaloIncludeFileCache {
  files: Record<string, string>;
  sourceDir: string;
}

/** Sync include host backed by a preloaded path → text map. */
export function buildIncludeHostCallbacks(
  files: Record<string, string> | Map<string, string>,
  sourceDir: string
): NonNullable<MegaloCompileOptions["includes"]> {
  const normalized = new Map<string, string>();
  const entries =
    files instanceof Map ? files.entries() : Object.entries(files);
  for (const [path, text] of entries) {
    normalized.set(path, text);
    normalized.set(path.replace(/\//g, "\\"), text);
    normalized.set(path.replace(/\\/g, "/"), text);
  }
  const lookup = (path: string): string | undefined =>
    normalized.get(path) ??
    normalized.get(path.replace(/\//g, "\\")) ??
    normalized.get(path.replace(/\\/g, "/"));

  return {
    inputDir: sourceDir,
    readFile: (path: string) => {
      const hit = lookup(path);
      if (hit === undefined) {
        throw new Error(`Include file was not loaded: ${path}`);
      }
      return hit;
    },
    exists: (path: string) => lookup(path) !== undefined,
  };
}

export function megaloCompileOptionsFromCache(
  cache: MegaloIncludeFileCache
): MegaloCompileOptions {
  return {
    includes: buildIncludeHostCallbacks(cache.files, cache.sourceDir),
  };
}

function parentDirectory(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  const index = normalized.lastIndexOf("/");
  if (index <= 0) {
    return ".";
  }
  return normalized.slice(0, index);
}

function joinPaths(base: string, relative: string): string {
  return joinLogicalPaths(base, relative);
}

function lookupCachedText(
  files: Record<string, string>,
  path: string
): { text: string; uri: string } | undefined {
  const candidates = [
    path,
    path.replace(/\//g, "\\"),
    path.replace(/\\/g, "/"),
  ];
  for (const candidate of candidates) {
    const hit = files[candidate];
    if (hit !== undefined) {
      return { text: hit, uri: candidate };
    }
  }
  // Case-insensitive fallback for Windows paths.
  const lower = path.replace(/\\/g, "/").toLowerCase();
  for (const [key, text] of Object.entries(files)) {
    if (key.replace(/\\/g, "/").toLowerCase() === lower) {
      return { text, uri: key };
    }
  }
  return;
}

export function resolveIncludeFromCache(
  cache: MegaloIncludeFileCache
): (
  path: string,
  ctx: { kind: "include" | "localized_include"; fromUri?: string }
) => Promise<{ text: string; uri: string } | null> {
  return async (path, ctx) => {
    const fromDir = ctx.fromUri
      ? parentDirectory(ctx.fromUri)
      : cache.sourceDir;
    const absolute = isAbsoluteLogicalPath(path)
      ? path
      : joinPaths(fromDir, path);
    return lookupCachedText(cache.files, absolute) ?? null;
  };
}

export function megaloCompileOptionsFromWorkspace(
  workspace: Workspace | null,
  includeCache?: MegaloIncludeFileCache,
  resolvedBaseProgram?: MegaloProgram | null,
  resolvedBaseCustomVariant?:
    | import("@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352").c_game_engine_custom_variant
    | null,
  resolvedBaseCustomVariantMgloBytes?: Uint8Array
): MegaloCompileOptions | undefined {
  const fromIncludes = includeCache?.sourceDir
    ? megaloCompileOptionsFromCache(includeCache)
    : undefined;

  if (
    !(
      workspace ||
      fromIncludes ||
      resolvedBaseProgram ||
      resolvedBaseCustomVariant ||
      resolvedBaseCustomVariantMgloBytes?.length
    )
  ) {
    return;
  }

  const fileProvider = workspace
    ? createPlatformFileProvider(workspace)
    : undefined;

  return {
    ...fromIncludes,
    ...(resolvedBaseProgram ? { resolvedBaseProgram } : {}),
    ...(resolvedBaseCustomVariant ? { resolvedBaseCustomVariant } : {}),
    ...(resolvedBaseCustomVariantMgloBytes?.length
      ? { resolvedBaseCustomVariantMgloBytes }
      : {}),
    ...(workspace && fileProvider
      ? {
          base: {
            fileProvider,
            outputDir: workspace.outputPath ?? workspace.inputPath,
            searchDirs: [
              workspace.outputPath,
              fromIncludes?.includes?.inputDir ??
                fromIncludes?.includes?.sourceDir ??
                workspace.inputPath,
              workspace.inputPath,
            ].filter(
              (dir, index, dirs): dir is string =>
                typeof dir === "string" &&
                dir !== "" &&
                dirs.indexOf(dir) === index
            ),
          },
        }
      : {}),
  };
}

export function includeErrorsToDiagnostics(
  errors: MegaloIncludeError[]
): MegaloDiagnostic[] {
  return errors.map((error) => ({
    line: error.line,
    column: error.column,
    offset: error.offset,
    length: error.length,
    message: error.message,
    severity: "error" as const,
  }));
}

export function includeCompileFailureAnalysis(failure: {
  message: string;
  diagnostics: MegaloDiagnostic[];
}): {
  compileState: "error";
  errorCount: number;
  message: string;
  byteIdentical: null;
  byteDiffCount: null;
  compiledByteLength: null;
  mgloBytes: null;
  compileTiming: null;
  diagnostics: MegaloDiagnostic[];
} {
  return {
    compileState: "error",
    errorCount: failure.diagnostics.length,
    message: failure.message,
    byteIdentical: null,
    byteDiffCount: null,
    compiledByteLength: null,
    mgloBytes: null,
    compileTiming: null,
    diagnostics: failure.diagnostics,
  };
}

export function activeIncludeCache(
  cache: MegaloIncludeFileCache
): MegaloIncludeFileCache | undefined {
  return cache.sourceDir ? cache : undefined;
}

export function includeFailureAnalysis(errors: MegaloIncludeError[]): {
  compileState: "error";
  errorCount: number;
  message: string;
  diagnostics: MegaloDiagnostic[];
} {
  const diagnostics = includeErrorsToDiagnostics(errors);
  const first = errors[0];
  const message =
    errors.length === 0
      ? translate("include_resolution_failed")
      : errors.length === 1 && first
        ? translate("include_error_at_line", {
            line: first.line,
            message: first.message,
          })
        : translate("include_errors_count", { count: errors.length });
  return {
    compileState: "error",
    errorCount: Math.max(diagnostics.length, 1),
    message,
    diagnostics:
      diagnostics.length > 0
        ? diagnostics
        : [
            {
              line: 1,
              column: 1,
              message,
              severity: "error" as const,
            },
          ],
  };
}
