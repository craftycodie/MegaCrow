import type { LocalDiskNode } from "../../files/localFolder";

export function countFiles(nodes: LocalDiskNode[]): number {
  let total = 0;
  for (const node of nodes) {
    if (node.type === "file") {
      total += 1;
    } else if (node.children) {
      total += countFiles(node.children);
    }
  }
  return total;
}
