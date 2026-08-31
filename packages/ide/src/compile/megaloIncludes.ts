import { createPlatformFileProvider } from "../files/fileProvider";
import type { Workspace } from "../workspace/workspace";
import type { MegaloDiagnostic } from "./diagnostics";
import {
  buildIncludeHostCallbacks,
  includeFailureAnalysis,
  type MegaloIncludeFileCache,
} from "./includeDiagnostics";
import {
  findMegaloIncludeDirectives,
  type MegaloIncludeError,
  sourceHasIncludeDirectives,
  tryExpandMegaloIncludes,
  unresolvedIncludeErrors,
} from "./megaloIncludeScan";

/** @deprecated Prefer workspace.inputPath from the active workspace. */
export const HREK_MEGALO_DIR =
  "C:\\Program Files (x86)\\Steam\\steamapps\\common\\HREK\\data\\multiplayer\\megalo";

/** Absolute path to a Megalo source file on disk (desktop app). */
export interface MegaloIncludeRoot {
  absoluteFilePath: string;
}

export type IncludeCompileResult =
  | { ok: true; includeCache: MegaloIncludeFileCache }
  | { ok: false; message: string; diagnostics: MegaloDiagnostic[] };

function cacheKey(path: string): string {
  return path.replace(/\//g, "\\");
}

function storeInCache(
  cache: Map<string, string>,
  path: string,
  text: string
): void {
  cache.set(path, text);
  cache.set(cacheKey(path), text);
  cache.set(path.replace(/\\/g, "/"), text);
}

function unresolvedRootMessage(
  fileName: string | null,
  workspace: Workspace | null
): string {
  const label = fileName ?? "This file";
  if (!workspace) {
    return `${label}: cannot resolve includes without a workspace. Open the desktop app or save scripts to the browser workspace.`;
  }
  return `${label}: cannot resolve includes. Open this file from the workspace input folder (${workspace.name}).`;
}

/** Guess a file path for stock megalo scripts opened without an explicit path. */
export async function inferWorkspaceIncludeRoot(
  fileName: string,
  workspace: Workspace | null
): Promise<MegaloIncludeRoot | null> {
  if (!(workspace && fileName)) {
    return null;
  }
  const baseName = fileName.split(/[/\\]/).pop() ?? fileName;
  if (!baseName.toLowerCase().endsWith(".txt")) {
    return null;
  }
  const fileProvider = createPlatformFileProvider(workspace);
  if (!fileProvider) {
    return null;
  }
  const absoluteFilePath = fileProvider.resolvePath(
    baseName,
    workspace.inputPath
  );
  const text = await fileProvider.readText(absoluteFilePath);
  if (!text) {
    return null;
  }
  return { absoluteFilePath };
}

/** Resolve where includes should be loaded from for the current editor file. */
export async function resolveIncludeRoot(
  fileName: string | null,
  explicit: MegaloIncludeRoot | null | undefined,
  workspace: Workspace | null = null
): Promise<MegaloIncludeRoot | null> {
  if (explicit) {
    return explicit;
  }
  if (!(workspace && fileName)) {
    return null;
  }
  return inferWorkspaceIncludeRoot(fileName, workspace);
}

function failIncludeResolution(
  source: string,
  message: string
): IncludeCompileResult {
  const failure = includeFailureAnalysis(
    unresolvedIncludeErrors(source, message)
  );
  return {
    ok: false,
    message: failure.message,
    diagnostics: failure.diagnostics,
  };
}

function failIncludeErrors(errors: MegaloIncludeError[]): IncludeCompileResult {
  const failure = includeFailureAnalysis(errors);
  return {
    ok: false,
    message: failure.message,
    diagnostics: failure.diagnostics,
  };
}

async function parentDirectory(filePath: string): Promise<string> {
  const normalized = filePath.replace(/\\/g, "/");
  const index = normalized.lastIndexOf("/");
  if (index <= 0) {
    return ".";
  }
  return normalized.slice(0, index);
}

async function preloadIncludeTree(
  source: string,
  absoluteFilePath: string,
  fileProvider: NonNullable<ReturnType<typeof createPlatformFileProvider>>,
  cache: Map<string, string>,
  chain: string[] = []
): Promise<void> {
  const normalized = absoluteFilePath.replace(/\\/g, "/");
  if (chain.includes(normalized)) {
    throw new Error(`include cycle: ${[...chain, normalized].join(" -> ")}`);
  }
  storeInCache(cache, absoluteFilePath, source);

  const dir = await parentDirectory(absoluteFilePath);
  for (const relPath of findMegaloIncludeDirectives(source)) {
    const target = fileProvider.resolvePath(relPath, dir);
    const cached =
      cache.get(target) ??
      cache.get(cacheKey(target)) ??
      cache.get(target.replace(/\\/g, "/"));
    if (cached !== undefined) {
      continue;
    }
    const text = await fileProvider.readText(target);
    if (text === null) {
      throw new Error(`Include file not found: ${relPath} -> ${target}`);
    }
    await preloadIncludeTree(text, target, fileProvider, cache, [
      ...chain,
      normalized,
    ]);
  }
}

/**
 * Load every file needed by `include` directives through the platform FileProvider.
 * Returns a serializable cache for the compile worker, or errors on each include line.
 */
export async function prepareIncludeCompileContext(
  source: string,
  fileName: string | null,
  explicitRoot: MegaloIncludeRoot | null | undefined,
  workspace: Workspace | null = null
): Promise<IncludeCompileResult> {
  if (!sourceHasIncludeDirectives(source)) {
    return { ok: true, includeCache: { sourceDir: "", files: {} } };
  }

  const root = await resolveIncludeRoot(fileName, explicitRoot, workspace);
  if (!root) {
    return failIncludeResolution(
      source,
      unresolvedRootMessage(fileName, workspace)
    );
  }

  const fileProvider = createPlatformFileProvider(workspace);
  if (!fileProvider) {
    return failIncludeResolution(
      source,
      unresolvedRootMessage(fileName, workspace)
    );
  }

  const cache = new Map<string, string>();
  const sourceDir = await parentDirectory(root.absoluteFilePath);

  try {
    await preloadIncludeTree(
      source,
      root.absoluteFilePath,
      fileProvider,
      cache
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return failIncludeResolution(source, message);
  }

  const compileOptions = {
    includes: buildIncludeHostCallbacks(cache, sourceDir),
  };

  const expanded = tryExpandMegaloIncludes(source, compileOptions);
  if (!expanded.ok) {
    return failIncludeErrors(expanded.errors);
  }

  const files: Record<string, string> = {};
  for (const [path, text] of cache.entries()) {
    files[path] = text;
  }

  return {
    ok: true,
    includeCache: { sourceDir, files },
  };
}

export { findMegaloIncludeDirectives, sourceHasIncludeDirectives };
