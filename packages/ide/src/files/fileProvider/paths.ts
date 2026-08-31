/** Normalize path separators to forward slashes for logical workspace paths. */
export function normalizeLogicalPath(path: string): string {
  return path.replace(/\\/g, "/").replace(/\/+/g, "/");
}

export function joinLogicalPaths(base: string, relative: string): string {
  const normalizedBase = normalizeLogicalPath(base).replace(/\/+$/, "");
  const normalizedRelative = normalizeLogicalPath(relative).replace(/^\/+/, "");
  if (!normalizedBase) {
    return normalizedRelative;
  }
  if (!normalizedRelative) {
    return normalizedBase;
  }
  return `${normalizedBase}/${normalizedRelative}`;
}

export function isAbsoluteLogicalPath(path: string): boolean {
  const normalized = normalizeLogicalPath(path);
  return (
    /^[A-Za-z]:\//.test(normalized) ||
    normalized.startsWith("/") ||
    normalized.startsWith("workspace/")
  );
}

/** Filesystem absolute paths for CLI (no logical `workspace/` prefix). */
export function isAbsoluteFilesystemPath(path: string): boolean {
  const normalized = normalizeLogicalPath(path);
  return /^[A-Za-z]:\//.test(normalized) || normalized.startsWith("/");
}
