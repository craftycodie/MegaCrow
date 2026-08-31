import {
  formatLocalDiskPath,
  type LocalDiskNode,
  pathKey,
} from "../../files/localFolder";

function isSamePath(a: string[], b: string[]): boolean {
  return (
    a.length === b.length && a.every((segment, index) => segment === b[index])
  );
}

function isPathPrefix(prefix: string[], path: string[]): boolean {
  if (prefix.length === 0) {
    return true;
  }
  if (prefix.length > path.length) {
    return false;
  }
  return prefix.every((segment, index) => segment === path[index]);
}

/** Drop nested children when an ancestor is also selected. */
export function pruneNestedPaths(paths: string[][]): string[][] {
  const sorted = [...paths].sort((a, b) => a.length - b.length);
  const kept: string[][] = [];
  for (const path of sorted) {
    if (kept.some((prefix) => isPathPrefix(prefix, path))) {
      continue;
    }
    kept.push(path);
  }
  return kept;
}

export function parsePathKey(key: string): string[] {
  if (key === "") {
    return [];
  }
  return key.split("/");
}

/** Destination parent for a drop path key (files → their parent). */
export function dropParentForPathKey(
  targetKey: string,
  targetType: "file" | "directory" | "root",
  fromPath: string[]
): string[] | null {
  if (targetType === "root") {
    if (isPathPrefix(fromPath, [])) {
      return null;
    }
    const fromParent = fromPath.slice(0, -1);
    if (isSamePath(fromParent, [])) {
      return null;
    }
    return [];
  }
  const targetPath = parsePathKey(targetKey);
  if (targetType === "directory") {
    if (isSamePath(fromPath, targetPath)) {
      return null;
    }
    if (isPathPrefix(fromPath, targetPath)) {
      return null;
    }
    return targetPath;
  }
  const parent = targetPath.slice(0, -1);
  if (isPathPrefix(fromPath, parent)) {
    return null;
  }
  return parent;
}

export function dropParentForPaths(
  targetKey: string,
  targetType: "file" | "directory" | "root",
  fromPaths: string[][]
): string[] | null {
  if (fromPaths.length === 0) {
    return null;
  }
  let result: string[] | null = null;
  for (const path of fromPaths) {
    const parent = dropParentForPathKey(targetKey, targetType, path);
    if (parent === null) {
      return null;
    }
    result = parent;
  }
  return result;
}

export function findDropTarget(
  clientX: number,
  clientY: number
): {
  key: string;
  type: "file" | "directory" | "root";
} | null {
  const el = document.elementFromPoint(clientX, clientY);
  if (!(el instanceof Element)) {
    return null;
  }
  const row = el.closest("[data-tree-drop]");
  if (row instanceof HTMLElement) {
    const key = row.dataset.treePath;
    const type = row.dataset.treeDrop;
    if (key === undefined || (type !== "file" && type !== "directory")) {
      return null;
    }
    return { key, type };
  }
  const root = el.closest("[data-tree-root]");
  if (root) {
    return { key: "", type: "root" };
  }
  return null;
}

export const MEGACROW_TREE_PATH_MIME = "application/x-megacrow-tree-path";

const DRAG_THRESHOLD_PX = 5;

export { DRAG_THRESHOLD_PX };

let activeTreeDragPaths: string[][] | null = null;

export function isMegacrowTreeDragActive(): boolean {
  return activeTreeDragPaths !== null;
}

export function setActiveTreeDragPaths(paths: string[][] | null): void {
  activeTreeDragPaths = paths;
}

export function flattenVisibleNodes(
  nodes: LocalDiskNode[],
  expandedPaths: Set<string>
): LocalDiskNode[] {
  const out: LocalDiskNode[] = [];
  const walk = (list: LocalDiskNode[]) => {
    for (const node of list) {
      out.push(node);
      if (
        node.type === "directory" &&
        expandedPaths.has(pathKey(node.path)) &&
        node.children &&
        node.children.length > 0
      ) {
        walk(node.children);
      }
    }
  };
  walk(nodes);
  return out;
}

export function findFilePathByDisplayName(
  nodes: readonly LocalDiskNode[],
  displayName: string
): string[] | null {
  for (const node of nodes) {
    if (node.type === "file") {
      const displayPath = formatLocalDiskPath(node.path);
      if (
        displayName.localeCompare(displayPath, undefined, {
          sensitivity: "accent",
        }) === 0
      ) {
        return node.path;
      }
    }
    if (node.children && node.children.length > 0) {
      const nested = findFilePathByDisplayName(node.children, displayName);
      if (nested) {
        return nested;
      }
    }
  }
  return null;
}

export function ancestorPathKeys(path: string[]): string[] {
  const keys: string[] = [];
  for (let i = 1; i < path.length; i++) {
    keys.push(pathKey(path.slice(0, i)));
  }
  return keys;
}
