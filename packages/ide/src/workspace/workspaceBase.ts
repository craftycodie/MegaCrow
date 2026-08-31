import {
  baseFileCompiledFromSourceMessage,
  baseFileCompileFailedMessage,
  baseFileNotFoundMessage,
  isMegaloVersionId,
  MEGALO_VERSIONS,
  resolveBaseMgloBytes,
} from "@megacrow/megalo";
import type { MegaloDiagnostic } from "../compile/diagnostics";
import {
  baseDirectiveLocation,
  parseBaseDirective,
} from "../compile/megaloBaseDirective";
import {
  getCompileMegacrowExtensions,
  megaloErrorLocation,
} from "../compile/megaloCompile";
import { type MegaloProgram, tryParse } from "../compile/megaloProgram";
import { createPlatformFileProvider } from "../files/fileProvider";
import type { Workspace } from "./workspace";

export type WorkspaceBaseResult =
  | {
      ok: true;
      baseProgram: MegaloProgram | null;
      baseCustomVariant?: import("@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352").c_game_engine_custom_variant;
      baseCustomVariantMgloBytes?: Uint8Array;
      /** Warnings from JIT-compiling a sibling `.txt` base (blamed on `base`). */
      jitDiagnostics?: MegaloDiagnostic[];
    }
  | { ok: false; message: string; diagnostics: MegaloDiagnostic[] };

export interface WorkspaceBaseResolveOptions {
  /** Status-bar progress while megalo JIT-compiles a sibling `.txt` base. */
  onStatus?: (message: string) => void;
}

function diagnosticFromParseFailure(
  parsed: Extract<ReturnType<typeof tryParse>, { ok: false }>
): MegaloDiagnostic[] {
  return [
    {
      line: parsed.line,
      column: parsed.column,
      message: parsed.message,
      severity: "error",
    },
  ];
}

function diagnosticFromError(error: unknown): MegaloDiagnostic[] {
  const { message, line, column } = megaloErrorLocation(error);
  return [
    {
      line,
      column,
      message,
      severity: "error",
    },
  ];
}

function diagnosticOnBaseDirective(
  source: string,
  message: string,
  severity: "error" | "warning"
): MegaloDiagnostic {
  const loc = baseDirectiveLocation(source);
  return {
    line: loc?.line ?? 1,
    column: loc?.column ?? 1,
    endColumn: loc?.endColumn,
    offset: loc?.offset,
    length: loc?.length,
    message,
    severity,
  };
}

function baseDirectiveDiagnostics(
  source: string,
  message: string
): MegaloDiagnostic[] {
  return [diagnosticOnBaseDirective(source, message, "error")];
}

function parentDirectory(filePath: string): string {
  const normalized = filePath.replace(/\\/g, "/");
  const index = normalized.lastIndexOf("/");
  if (index <= 0) {
    return ".";
  }
  const parent = normalized.slice(0, index);
  return /\\/.test(filePath) ? parent.replace(/\//g, "\\") : parent;
}

function displayFileName(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/");
  return parts.at(-1) || path;
}

/** Resolve a `base "…"` directive using workspace paths; JIT compile via megalo. */
export async function resolveWorkspaceBaseProgram(
  source: string,
  workspace: Workspace,
  sourceDir?: string,
  options?: WorkspaceBaseResolveOptions
): Promise<WorkspaceBaseResult> {
  const parsed = tryParse(source);
  if (!parsed.ok) {
    return {
      ok: false,
      message: `Parse error at line ${parsed.line}: ${parsed.message}`,
      diagnostics: diagnosticFromParseFailure(parsed),
    };
  }

  const baseRef = parseBaseDirective(source);
  if (!baseRef) {
    return { ok: true, baseProgram: null };
  }
  const baseMgloPath = baseRef.path;

  const outputPath = workspace.outputPath?.trim() || null;
  const searchDirs = [
    outputPath,
    sourceDir ?? workspace.inputPath,
    workspace.inputPath,
  ].filter(
    (dir, index, dirs): dir is string =>
      typeof dir === "string" && dir !== "" && dirs.indexOf(dir) === index
  );

  if (workspace.type !== "tauri" && workspace.type !== "opfs") {
    const message = baseFileNotFoundMessage(baseMgloPath);
    console.warn(`[megacrow] ${message}`);
    return {
      ok: false,
      message,
      diagnostics: baseDirectiveDiagnostics(source, message),
    };
  }

  const fileProvider = createPlatformFileProvider(workspace);
  if (!fileProvider) {
    const message = baseFileNotFoundMessage(baseMgloPath);
    console.warn(`[megacrow] ${message}`);
    return {
      ok: false,
      message,
      diagnostics: baseDirectiveDiagnostics(source, message),
    };
  }

  const fromUri = `${(sourceDir ?? workspace.inputPath).replace(/\\/g, "/")}/.`;

  const resolveInSearchDirs = async (
    relativePath: string,
    from?: string
  ): Promise<string | null> => {
    const dirs = [
      ...(from ? [parentDirectory(from)] : []),
      ...searchDirs,
    ].filter((dir, index, list) => dir !== "" && list.indexOf(dir) === index);

    for (const dir of dirs) {
      const absolute = fileProvider.resolvePath(relativePath, dir);
      const hit = await fileProvider.readText(absolute);
      if (hit !== null) {
        return absolute;
      }
      if (fileProvider.readBytes) {
        const bytes = await fileProvider.readBytes(absolute);
        if (bytes !== null && bytes.length > 0) {
          return absolute;
        }
      }
    }
    return null;
  };

  try {
    const versionId = workspace.megaloVersion;
    const version =
      isMegaloVersionId(versionId) && MEGALO_VERSIONS[versionId]
        ? MEGALO_VERSIONS[versionId]
        : MEGALO_VERSIONS["107-mcc"];
    const resolved = await resolveBaseMgloBytes(baseMgloPath, {
      version,
      fromUri,
      megacrowExtensions: getCompileMegacrowExtensions(),
      onCompileProgress: options?.onStatus,
      // Only look for built `.mglo` when the workspace has an output folder.
      resolveBaseFile: outputPath
        ? async (path: string, ctx: { fromUri?: string }) => {
            const absolute = await resolveInSearchDirs(path, ctx.fromUri);
            if (absolute === null || !fileProvider.readBytes) {
              return null;
            }
            return fileProvider.readBytes(absolute);
          }
        : undefined,
      resolveInclude: async (
        path: string,
        ctx: { kind: "include" | "localized_include"; fromUri?: string }
      ) => {
        const absolute = await resolveInSearchDirs(path, ctx.fromUri);
        if (absolute === null) {
          return null;
        }
        const text = await fileProvider.readText(absolute);
        return text === null ? null : { text, uri: absolute };
      },
    });

    if (!resolved.ok) {
      const message =
        resolved.reason === "compile_failed"
          ? baseFileCompileFailedMessage(baseMgloPath)
          : baseFileNotFoundMessage(baseMgloPath);
      console.warn(`[megacrow] ${message}`);
      return {
        ok: false,
        message,
        diagnostics: baseDirectiveDiagnostics(source, message),
      };
    }

    return {
      ok: true,
      baseProgram: null,
      baseCustomVariantMgloBytes: resolved.bytes,
      jitDiagnostics: resolved.compiledFromSource
        ? [
            diagnosticOnBaseDirective(
              source,
              baseFileCompiledFromSourceMessage(
                displayFileName(resolved.compiledFromSource.sourceUri),
                resolved.compiledFromSource.warningCount
              ),
              "warning"
            ),
          ]
        : undefined,
    };
  } catch (error) {
    const message =
      error instanceof Error
        ? error.message
        : baseFileNotFoundMessage(baseMgloPath);
    console.warn(`[megacrow] ${message}`);
    return {
      ok: false,
      message,
      diagnostics: baseDirectiveDiagnostics(source, message),
    };
  }
}

export function workspaceParseFailure(
  parsed: Extract<ReturnType<typeof tryParse>, { ok: false }>
): { ok: false; message: string; diagnostics: MegaloDiagnostic[] } {
  return {
    ok: false,
    message: `Parse error at line ${parsed.line}: ${parsed.message}`,
    diagnostics: diagnosticFromParseFailure(parsed),
  };
}

export function workspaceUnexpectedFailure(error: unknown): {
  ok: false;
  message: string;
  diagnostics: MegaloDiagnostic[];
} {
  const diagnostic = diagnosticFromError(error)[0]!;
  return {
    ok: false,
    message: diagnostic.message,
    diagnostics: [diagnostic],
  };
}
