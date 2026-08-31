import type { MegaloIncludeFileCache } from "../compile/includeDiagnostics";
import {
  type IncludeCompileResult,
  type MegaloIncludeRoot,
  prepareIncludeCompileContext,
} from "../compile/megaloIncludes";
import { type MegaloProgram, tryParse } from "../compile/megaloProgram";
import type { Workspace } from "./workspace";
import {
  resolveWorkspaceBaseProgram,
  type WorkspaceBaseResolveOptions,
  workspaceParseFailure,
} from "./workspaceBase";

export interface CompileContextResult {
  /** Warnings from JIT base compile, blamed on the `base` directive. */
  baseJitDiagnostics?: import("../compile/diagnostics").MegaloDiagnostic[];
  includeCache: MegaloIncludeFileCache | undefined;
  ok: true;
  resolvedBaseCustomVariant?:
    | import("@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352").c_game_engine_custom_variant
    | undefined;
  resolvedBaseCustomVariantMgloBytes?: Uint8Array;
  resolvedBaseProgram: MegaloProgram | null;
}

export type CompileContextFailure = Extract<
  IncludeCompileResult,
  { ok: false }
>;

export async function prepareWorkspaceCompileContext(
  source: string,
  fileName: string | null,
  includeRoot: MegaloIncludeRoot | null | undefined,
  workspace: Workspace | null,
  options?: WorkspaceBaseResolveOptions
): Promise<CompileContextResult | CompileContextFailure> {
  const parsed = tryParse(source);
  if (!parsed.ok) {
    return workspaceParseFailure(parsed);
  }

  const includeResult = await prepareIncludeCompileContext(
    source,
    fileName,
    includeRoot,
    workspace
  );
  if (!includeResult.ok) {
    return includeResult;
  }

  if (!workspace) {
    return {
      ok: true,
      includeCache: includeResult.includeCache.sourceDir
        ? includeResult.includeCache
        : undefined,
      resolvedBaseProgram: null,
    };
  }

  const sourceDir = includeResult.includeCache.sourceDir || workspace.inputPath;
  const baseResult = await resolveWorkspaceBaseProgram(
    source,
    workspace,
    sourceDir,
    options
  );
  if (!baseResult.ok) {
    return {
      ok: false,
      message: baseResult.message,
      diagnostics: baseResult.diagnostics,
    };
  }

  return {
    ok: true,
    includeCache: includeResult.includeCache.sourceDir
      ? includeResult.includeCache
      : undefined,
    resolvedBaseProgram: baseResult.baseProgram,
    resolvedBaseCustomVariant: baseResult.baseCustomVariant,
    resolvedBaseCustomVariantMgloBytes: baseResult.baseCustomVariantMgloBytes,
    baseJitDiagnostics: baseResult.jitDiagnostics,
  };
}
