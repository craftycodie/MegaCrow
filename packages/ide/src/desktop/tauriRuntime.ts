export function isTauriRuntime(): boolean {
  return typeof window !== "undefined" && "__TAURI_INTERNALS__" in window;
}

/** True for `tauri dev` / debug Tauri builds (not browser or release). */
export function isTauriDebugBuild(): boolean {
  return isTauriRuntime() && Boolean(import.meta.env.TAURI_ENV_DEBUG);
}
