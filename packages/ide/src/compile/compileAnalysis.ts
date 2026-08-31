import type {
  CompiledMegaloMetadata,
  VariantLimitUsage,
} from "@megacrow/megalo";
import { translate } from "../localization";
import type { MegaloDiagnostic } from "./diagnostics";
import type { MegaloCompileTiming } from "./megaloCompile";

export type CompileState = "idle" | "parsing" | "ok" | "warn" | "error";

export interface SourceAnalysis {
  byteDiffCount: number | null;
  byteIdentical: boolean | null;
  compiledByteLength: number | null;
  compiledMetadata?: CompiledMegaloMetadata | null;
  compileState: CompileState;
  compileTiming: MegaloCompileTiming | null;
  diagnostics: MegaloDiagnostic[];
  errorCount: number;
  limitUsage?: VariantLimitUsage | null;
  message: string;
  mgloBytes: Uint8Array | null;
}

export const idleAnalysis = (): SourceAnalysis => ({
  compileState: "idle",
  errorCount: 0,
  message: translate("status_no_gametype_loaded"),
  byteIdentical: null,
  byteDiffCount: null,
  compiledByteLength: null,
  mgloBytes: null,
  compileTiming: null,
  diagnostics: [],
});

/**
 * While editing, failed / in-progress compiles should not wipe sidebar
 * identity, capacity meters, or size from the last successful compile.
 */
export function withPreservedCompileArtifacts(
  previous: SourceAnalysis,
  next: SourceAnalysis
): SourceAnalysis {
  if (next.compileState === "ok" || next.compileState === "warn") {
    return next;
  }
  if (next.compileState === "idle") {
    return next;
  }
  const hadArtifacts =
    previous.compiledMetadata != null ||
    previous.compiledByteLength != null ||
    previous.limitUsage != null;
  if (!hadArtifacts) {
    return next;
  }
  return {
    ...next,
    compiledMetadata: next.compiledMetadata ?? previous.compiledMetadata,
    compiledByteLength: next.compiledByteLength ?? previous.compiledByteLength,
    limitUsage: next.limitUsage ?? previous.limitUsage,
  };
}
