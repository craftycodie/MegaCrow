import { ipcRegenerateObjectListsWithTool } from "./ipc";

/** Run HREK tool.exe to regenerate object list string files. */
export async function regenerateObjectListsWithTool(
  editingKitRoot: string,
  objectListsDir: string
): Promise<void> {
  await ipcRegenerateObjectListsWithTool(editingKitRoot, objectListsDir);
}
