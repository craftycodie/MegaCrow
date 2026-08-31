import { isTauriRuntime } from "../desktop/tauriRuntime";

export type UnwatchWorkspaceInput = () => void;

/**
 * Watch a Tauri workspace input folder (recursive) and invoke `onChange`
 * when files or directories are created, modified, renamed, or removed.
 * Returns an unwatch function, or `null` when not running under Tauri.
 */
export async function watchWorkspaceInput(
  inputPath: string,
  onChange: () => void
): Promise<UnwatchWorkspaceInput | null> {
  if (!(isTauriRuntime() && inputPath.trim())) {
    return null;
  }

  const { watch } = await import("@tauri-apps/plugin-fs");
  return watch(inputPath, () => onChange(), {
    recursive: true,
    delayMs: 400,
  });
}
