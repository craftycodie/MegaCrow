import {
  buildIncludeHostCallbacks,
  findMegaloIncludeDirectives,
  sourceHasIncludeDirectives,
  tryExpandMegaloIncludes,
} from "../compile";
import { decodeTextFile } from "../files";
import type { CliFilesystem } from "./filesystem";

function storeCached(
  cache: Map<string, string>,
  filePath: string,
  text: string
): void {
  cache.set(filePath, text);
  cache.set(filePath.replace(/\//g, "\\"), text);
  cache.set(filePath.replace(/\\/g, "/"), text);
}

async function preloadIncludeTree(
  source: string,
  entryPath: string,
  sourceDir: string,
  fs: CliFilesystem,
  cache: Map<string, string>,
  chain: string[] = []
): Promise<void> {
  const normalized = entryPath.replace(/\\/g, "/");
  if (chain.includes(normalized)) {
    throw new Error(`include cycle: ${[...chain, normalized].join(" -> ")}`);
  }
  storeCached(cache, entryPath, source);

  for (const relPath of findMegaloIncludeDirectives(source)) {
    const target = await fs.resolve(sourceDir, relPath);
    const cached =
      cache.get(target) ??
      cache.get(target.replace(/\//g, "\\")) ??
      cache.get(target.replace(/\\/g, "/"));
    if (cached !== undefined) {
      continue;
    }
    const text = decodeTextFile(await fs.readBytes(target));
    storeCached(cache, target, text);
    const targetDir = await fs.dirname(target);
    await preloadIncludeTree(text, target, targetDir, fs, cache, [
      ...chain,
      normalized,
    ]);
  }
}

export async function expandSourceIncludes(
  source: string,
  sourceDir: string,
  fs: CliFilesystem
): Promise<string> {
  if (!sourceHasIncludeDirectives(source)) {
    return source;
  }

  const cache = new Map<string, string>();
  const entryPath = await fs.resolve(sourceDir, "entry.txt");
  await preloadIncludeTree(source, entryPath, sourceDir, fs, cache);

  const expanded = tryExpandMegaloIncludes(source, {
    includes: buildIncludeHostCallbacks(cache, sourceDir),
  });
  if (!expanded.ok) {
    throw new Error(expanded.errors[0]?.message ?? "Include expansion failed");
  }
  return expanded.source;
}
