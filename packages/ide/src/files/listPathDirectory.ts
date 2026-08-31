import { readDir } from "@tauri-apps/plugin-fs";
import { isTauriRuntime } from "../desktop/tauriRuntime";
import { isOpfsSupported, listOpfsWorkspaceDirectory } from "./opfsStorage";

export interface PathDirectoryEntry {
  directory: boolean;
  name: string;
}

/** Returns immediate children, or `[]` when the directory is missing or unreadable. */
export async function listPathDirectoryEntries(
  absoluteOrLogicalDir: string
): Promise<PathDirectoryEntry[]> {
  if (isTauriRuntime()) {
    try {
      const entries = await readDir(absoluteOrLogicalDir);
      const result: PathDirectoryEntry[] = [];
      for (const entry of entries) {
        if (!entry.name) {
          continue;
        }
        if (entry.isDirectory) {
          result.push({ name: entry.name, directory: true });
        } else if (entry.isFile) {
          result.push({ name: entry.name, directory: false });
        }
      }
      return result;
    } catch {
      return [];
    }
  }

  if (isOpfsSupported()) {
    return listOpfsWorkspaceDirectory(absoluteOrLogicalDir);
  }

  return [];
}
