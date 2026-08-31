import { dirname } from "@tauri-apps/api/path";
import { mkdir, writeFile } from "@tauri-apps/plugin-fs";
import { isTauriRuntime } from "../desktop/tauriRuntime";
import { encodeMegaloTextFile } from "./decodeTextFile";
import { writeOpfsGametypeSource } from "./opfsStorage";

/** Write Megalo / object-list source to a desktop filesystem path (UTF-16 LE + BOM). */
export async function saveSourceFileToDisk(
  absolutePath: string,
  text: string
): Promise<void> {
  const parent = await dirname(absolutePath);
  await mkdir(parent, { recursive: true });
  await writeFile(absolutePath, encodeMegaloTextFile(text));
}

/**
 * Persist the editor buffer for the active file.
 * Desktop: `absoluteFilePath`. Browser OPFS: `fileName` under gametypes/.
 */
export async function persistOpenSourceFile(options: {
  absoluteFilePath: string | null | undefined;
  fileName: string | null | undefined;
  opfs: boolean;
  text: string;
}): Promise<boolean> {
  const { absoluteFilePath, fileName, opfs, text } = options;

  if (absoluteFilePath?.trim() && isTauriRuntime()) {
    await saveSourceFileToDisk(absoluteFilePath.trim(), text);
    return true;
  }

  if (opfs && fileName?.trim()) {
    await writeOpfsGametypeSource(fileName.trim(), text);
    return true;
  }

  return false;
}
