export interface LocalDiskNode {
  children?: LocalDiskNode[];
  name: string;
  /** Path segments from the selected root folder. */
  path: string[];
  type: "directory" | "file";
  /**
   * Bundled default shown in the tree before the file exists on disk
   * (object list tables). Saving materializes the file and clears this flag.
   */
  virtual?: boolean;
}

function pathKey(path: string[]): string {
  return path.join("/");
}

export function formatLocalDiskPath(path: string[]): string {
  return path.join("/");
}

export function sortLocalDiskNodes(nodes: LocalDiskNode[]): LocalDiskNode[] {
  return nodes.sort((a, b) => {
    if (a.type !== b.type) {
      return a.type === "directory" ? -1 : 1;
    }
    return a.name.localeCompare(b.name);
  });
}

export { pathKey };
