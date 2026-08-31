import type { MegaloIncludeFileCache } from "../compile/includeDiagnostics";
import { createPlatformFileProvider } from "../files/fileProvider";
import {
  isAbsoluteLogicalPath,
  joinLogicalPaths,
  normalizeLogicalPath,
} from "../files/fileProvider/paths";
import type { Workspace } from "../workspace/workspace";
import type { PathReferenceKind } from "./pathReferences";

export interface OpenablePathResult {
  absoluteFilePath: string;
  displayName: string;
  text: string;
}

function parentDirectory(filePath: string): string {
  const normalized = normalizeLogicalPath(filePath);
  const index = normalized.lastIndexOf("/");
  if (index <= 0) {
    return ".";
  }
  return normalized.slice(0, index);
}

function basename(filePath: string): string {
  const normalized = normalizeLogicalPath(filePath);
  const parts = normalized.split("/");
  return parts.at(-1) || filePath;
}

function displayNameFor(
  absoluteFilePath: string,
  workspace: Workspace | null
): string {
  const normalized = normalizeLogicalPath(absoluteFilePath);
  if (workspace?.inputPath) {
    const root = normalizeLogicalPath(workspace.inputPath).replace(/\/+$/, "");
    const prefix = `${root}/`;
    if (normalized.toLowerCase().startsWith(prefix.toLowerCase())) {
      return normalized.slice(prefix.length);
    }
  }
  return basename(absoluteFilePath);
}

function searchDirs(
  workspace: Workspace | null,
  currentFilePath: string | null
): string[] {
  const dirs: string[] = [];
  const add = (dir: string | null | undefined) => {
    if (!dir) {
      return;
    }
    const normalized = normalizeLogicalPath(dir);
    if (!dirs.some((d) => d.toLowerCase() === normalized.toLowerCase())) {
      dirs.push(normalized);
    }
  };
  if (currentFilePath) {
    add(parentDirectory(currentFilePath));
  }
  add(workspace?.inputPath);
  add(workspace?.outputPath);
  return dirs;
}

/** `.mglo` base → sibling `.txt` source path(s) to try. */
export function baseSourcePathCandidates(basePath: string): string[] {
  if (/\.txt$/i.test(basePath)) {
    return [basePath];
  }
  if (/\.mglo$/i.test(basePath)) {
    return [basePath.replace(/\.mglo$/i, ".txt")];
  }
  return [`${basePath}.txt`];
}

function lookupCachedText(
  cache: MegaloIncludeFileCache | undefined,
  absolute: string
): string | undefined {
  if (!cache) {
    return;
  }
  const candidates = [
    absolute,
    absolute.replace(/\//g, "\\"),
    absolute.replace(/\\/g, "/"),
  ];
  for (const candidate of candidates) {
    const hit = cache.files[candidate];
    if (hit !== undefined) {
      return hit;
    }
  }
  const lower = normalizeLogicalPath(absolute).toLowerCase();
  for (const [key, text] of Object.entries(cache.files)) {
    if (normalizeLogicalPath(key).toLowerCase() === lower) {
      return text;
    }
  }
  return;
}

async function resolveExistingTextPath(
  relativePath: string,
  dirs: string[],
  workspace: Workspace | null,
  includeCache?: MegaloIncludeFileCache
): Promise<OpenablePathResult | null> {
  const fileProvider = createPlatformFileProvider(workspace);
  for (const dir of dirs) {
    const absolute = fileProvider
      ? fileProvider.resolvePath(relativePath, dir)
      : isAbsoluteLogicalPath(relativePath)
        ? normalizeLogicalPath(relativePath)
        : joinLogicalPaths(dir, relativePath);

    const cached = lookupCachedText(includeCache, absolute);
    if (cached !== undefined) {
      return {
        absoluteFilePath: absolute,
        displayName: displayNameFor(absolute, workspace),
        text: cached,
      };
    }

    if (!fileProvider) {
      continue;
    }
    const text = await fileProvider.readText(absolute);
    if (text !== null) {
      return {
        absoluteFilePath: absolute,
        displayName: displayNameFor(absolute, workspace),
        text,
      };
    }
  }
  return null;
}

/**
 * Resolve an include/base path to an openable source file.
 * For `base`, only the sibling `.txt` source is opened (never the `.mglo`).
 */
export async function resolveOpenablePathReference(
  kind: PathReferenceKind,
  path: string,
  options: {
    workspace: Workspace | null;
    currentFilePath: string | null;
    includeCache?: MegaloIncludeFileCache;
  }
): Promise<OpenablePathResult | null> {
  const dirs = searchDirs(options.workspace, options.currentFilePath);
  if (dirs.length === 0 && !isAbsoluteLogicalPath(path)) {
    return null;
  }

  const candidates = kind === "base" ? baseSourcePathCandidates(path) : [path];

  for (const candidate of candidates) {
    const hit = await resolveExistingTextPath(
      candidate,
      dirs.length > 0 ? dirs : ["."],
      options.workspace,
      options.includeCache
    );
    if (hit) {
      return hit;
    }
  }
  return null;
}
