import { isTauriRuntime } from "../../desktop/tauriRuntime";
import type { Workspace } from "../../workspace/workspace";
import { isOpfsSupported } from "../opfsStorage";
import { createOpfsFileProvider } from "./opfsFileProvider";
import { createTauriFileProvider } from "./tauriFileProvider";
import type { FileProvider } from "./types";

export function createPlatformFileProvider(
  workspace?: Pick<Workspace, "type"> | null
): FileProvider | undefined {
  // Tauri/plugin-fs IPC requires `window`; Web Workers must use preloaded bytes/cache.
  if (typeof globalThis.window === "undefined") {
    return;
  }
  if (workspace?.type === "tauri" || isTauriRuntime()) {
    return createTauriFileProvider();
  }
  if (workspace?.type === "opfs" && isOpfsSupported()) {
    return createOpfsFileProvider();
  }
  if (isOpfsSupported() && !isTauriRuntime()) {
    return createOpfsFileProvider();
  }
  return;
}
