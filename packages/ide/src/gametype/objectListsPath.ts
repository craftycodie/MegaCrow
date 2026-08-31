/** True when a workspace-relative or absolute path is under `object_lists/`. */
export function isObjectListsPath(
  path: string | string[] | null | undefined
): boolean {
  if (!path) {
    return false;
  }
  const parts = Array.isArray(path)
    ? path
    : path.replace(/\\/g, "/").split("/");
  return parts.some((part) => part.toLowerCase() === "object_lists");
}

export function isObjectListsDirectoryName(name: string): boolean {
  return name.toLowerCase() === "object_lists";
}

/** True when `fileName` is a version-recognized object list (e.g. `objects.txt`). */
export function isRecognizedObjectListName(
  fileName: string,
  objectListNames: readonly string[]
): boolean {
  const lower = fileName.toLowerCase();
  return objectListNames.some((name) => name.toLowerCase() === lower);
}

/** Final path segment of a workspace-relative or absolute path. */
export function pathFileName(
  path: string | string[] | null | undefined
): string {
  if (!path) {
    return "";
  }
  if (Array.isArray(path)) {
    return path.at(-1) ?? "";
  }
  return path.replace(/\\/g, "/").split("/").pop() ?? "";
}

/**
 * True when the open path is under `object_lists/` and the filename is a
 * version-recognized object list. Other files in that folder are plain text.
 */
export function isObjectListDocument(
  path: string | string[] | null | undefined,
  objectListNames: readonly string[]
): boolean {
  if (!isObjectListsPath(path)) {
    return false;
  }
  const name = pathFileName(path);
  return name.length > 0 && isRecognizedObjectListName(name, objectListNames);
}
