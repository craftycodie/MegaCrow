import { resolveGameBuildNumber } from "@megacrow/megalo";
import {
  autosaveQueueFileSizeForMegaloVersionId,
  compiledFileTypeForSaveFormat,
  finalizeGametypeSaveBytes,
  type GametypeSaveFormat,
} from "../gametype/gametypeSaveFormat";
import { failedToCompileStatus, translate } from "../localization";
import type { Workspace } from "../workspace/workspace";
import type { SourceAnalysis } from "./compileAnalysis";
import type { MegaloDiagnostic } from "./diagnostics";
import { megaloDiagnosticFromLsp } from "./diagnostics";
import type { MegaloIncludeFileCache } from "./includeDiagnostics";
import {
  formatMegaloCompileTiming,
  getCompileMegaloVersion,
} from "./megaloCompile";
import {
  applyCompilerSettings,
  type MegaCrowCompilerSettings,
  setCompileGameBuildNumber,
  setCompileMegaloVersion,
} from "./megaloCompilerSettings";
import type { MegaloProgram } from "./megaloProgram";

export interface CompileDownloadContext {
  baseJitDiagnostics?: MegaloDiagnostic[];
  includeCache?: MegaloIncludeFileCache;
  resolvedBaseCustomVariant?: import("@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352").c_game_engine_custom_variant;
  resolvedBaseCustomVariantMgloBytes?: Uint8Array;
  resolvedBaseProgram?: MegaloProgram | null;
}

function finalizeForCurrentVersion(
  bytes: Uint8Array,
  format: GametypeSaveFormat
): Uint8Array {
  return finalizeGametypeSaveBytes(bytes, format, {
    autosaveSlotSize: autosaveQueueFileSizeForMegaloVersionId(
      getCompileMegaloVersion()
    ),
  });
}

/** Eagerly connect the LSP worker so first file open avoids cold-start latency. */
export function preloadCompileClient(): void {
  void import("../lsp/lspClient").then(({ preloadLspConnection }) => {
    preloadLspConnection();
  });
}

export function syncMegaloWorkspace(workspace: Workspace | null): void {
  setCompileMegaloVersion(workspace?.megaloVersion ?? "107-mcc");
  setCompileGameBuildNumber(
    workspace
      ? resolveGameBuildNumber(
          workspace.megaloVersion,
          workspace.gameBuildNumber
        )
      : undefined
  );
  void import("../lsp/lspClient").then(
    ({ lspConfigureResolveContext, lspSetMegaloVersion }) => {
      lspConfigureResolveContext({ workspace });
      if (workspace?.megaloVersion) {
        void lspSetMegaloVersion(workspace.megaloVersion);
      }
    }
  );
}

export function syncMegaloCompilerSettings(
  compilerSettings: MegaCrowCompilerSettings
): void {
  applyCompilerSettings(compilerSettings);
}

const supersededSourceAnalysis = (): SourceAnalysis => ({
  compileState: "parsing",
  errorCount: 0,
  message: translate("status_compiling"),
  byteIdentical: null,
  byteDiffCount: null,
  compiledByteLength: null,
  mgloBytes: null,
  compileTiming: null,
  diagnostics: [],
});

interface CompileJob {
  baseJitDiagnostics?: MegaloDiagnostic[];
  reject: (reason: unknown) => void;
  resolve: (value: SourceAnalysis) => void;
  source: string;
}

let compilePending: CompileJob | null = null;
let compileBusy = false;

async function runCompileOnce(
  source: string,
  baseJitDiagnostics?: MegaloDiagnostic[]
): Promise<SourceAnalysis> {
  const { lspRequestArtifacts } = await import("../lsp/lspClient");
  const started = performance.now();
  const result = await lspRequestArtifacts(source, [
    "semanticTokens",
    "diagnostics",
    "mglo",
  ]);
  if (result.error === "superseded") {
    return supersededSourceAnalysis();
  }
  const totalMs = performance.now() - started;
  const timing = { parseMs: 0, compileMs: totalMs, totalMs };
  const diagnostics = [
    ...(baseJitDiagnostics ?? []),
    ...result.diagnostics.map((d) => megaloDiagnosticFromLsp(d)),
  ];
  const errorCount = diagnostics.filter((d) => d.severity === "error").length;
  if (!(result.ok && result.bytes) || errorCount > 0) {
    return {
      compileState: "error",
      errorCount: Math.max(errorCount, 1),
      message: failedToCompileStatus(Math.max(errorCount, 1)),
      byteIdentical: null,
      byteDiffCount: null,
      compiledByteLength: null,
      mgloBytes: null,
      compileTiming: timing,
      diagnostics,
      limitUsage: result.limitUsage ?? null,
    };
  }
  return {
    compileState: diagnostics.some((d) => d.severity === "warning")
      ? "warn"
      : "ok",
    errorCount: 0,
    message: formatMegaloCompileTiming(timing) || translate("status_compiled"),
    byteIdentical: null,
    byteDiffCount: null,
    compiledByteLength: result.variantByteLength ?? result.bytes.length,
    mgloBytes: result.bytes,
    compiledMetadata: result.metadata ?? null,
    compileTiming: timing,
    diagnostics,
    limitUsage: result.limitUsage ?? null,
  };
}

async function drainCompileQueue(): Promise<void> {
  if (compileBusy) {
    return;
  }
  compileBusy = true;
  try {
    while (compilePending) {
      const job = compilePending;
      compilePending = null;
      try {
        const analysis = await runCompileOnce(
          job.source,
          job.baseJitDiagnostics
        );
        if (compilePending) {
          job.resolve(supersededSourceAnalysis());
        } else {
          job.resolve(analysis);
        }
      } catch (error) {
        if (compilePending) {
          job.resolve(supersededSourceAnalysis());
        } else {
          job.reject(error);
        }
      }
    }
  } finally {
    compileBusy = false;
    if (compilePending) {
      void drainCompileQueue();
    }
  }
}

export function requestCompileViaLsp(
  source: string,
  options?: { baseJitDiagnostics?: MegaloDiagnostic[] }
): Promise<SourceAnalysis> {
  return new Promise((resolve, reject) => {
    if (compilePending) {
      compilePending.resolve(supersededSourceAnalysis());
    }
    compilePending = {
      source,
      baseJitDiagnostics: options?.baseJitDiagnostics,
      resolve,
      reject,
    };
    void drainCompileQueue();
  });
}

function compileDownloadFallback(baseProgram: MegaloProgram | null): {
  output: Uint8Array | null;
  analysis: SourceAnalysis;
} {
  if (!baseProgram) {
    return {
      output: null,
      analysis: {
        compileState: "error",
        errorCount: 1,
        message: translate("status_load_gametype_first"),
        byteIdentical: null,
        byteDiffCount: null,
        compiledByteLength: null,
        mgloBytes: null,
        compileTiming: null,
        diagnostics: [],
      },
    };
  }
  return {
    output: null,
    analysis: {
      compileState: "error",
      errorCount: 1,
      message: failedToCompileStatus(1),
      byteIdentical: null,
      byteDiffCount: null,
      compiledByteLength: null,
      mgloBytes: null,
      compileTiming: null,
      diagnostics: [],
    },
  };
}

export async function requestCompileDownloadViaLsp(
  source: string,
  format: GametypeSaveFormat,
  _originalBytes: Uint8Array | null,
  baseProgram: MegaloProgram | null,
  _baselineSource: string | null,
  compileContext?: CompileDownloadContext
): Promise<{ output: Uint8Array | null; analysis: SourceAnalysis }> {
  try {
    const { lspCompileSource } = await import("../lsp/lspClient");
    const started = performance.now();
    const result = await lspCompileSource(
      source,
      compiledFileTypeForSaveFormat(format)
    );
    const totalMs = performance.now() - started;
    const timing = { parseMs: 0, compileMs: totalMs, totalMs };
    const diagnostics = [
      ...(compileContext?.baseJitDiagnostics ?? []),
      ...result.diagnostics.map((d) => megaloDiagnosticFromLsp(d)),
    ];
    if (!(result.ok && result.bytes)) {
      const errorCount = diagnostics.filter(
        (d) => d.severity === "error"
      ).length;
      return {
        output: null,
        analysis: {
          compileState: "error",
          errorCount,
          message: failedToCompileStatus(errorCount),
          byteIdentical: null,
          byteDiffCount: null,
          compiledByteLength: null,
          mgloBytes: null,
          compileTiming: timing,
          diagnostics,
          limitUsage: result.limitUsage ?? null,
        },
      };
    }
    const output = finalizeForCurrentVersion(result.bytes, format);
    return {
      output,
      analysis: {
        compileState: diagnostics.some((d) => d.severity === "warning")
          ? "warn"
          : "ok",
        errorCount: 0,
        message: formatMegaloCompileTiming(timing),
        byteIdentical: null,
        byteDiffCount: null,
        compiledByteLength:
          result.variantByteLength ??
          (format === "mglo" ? result.bytes.length : null),
        mgloBytes: format === "mglo" ? result.bytes : null,
        compiledMetadata: result.metadata ?? null,
        compileTiming: timing,
        diagnostics,
        limitUsage: result.limitUsage ?? null,
      },
    };
  } catch {
    return compileDownloadFallback(baseProgram);
  }
}
