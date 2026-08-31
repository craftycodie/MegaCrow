import { openUrl } from "@tauri-apps/plugin-opener";
import { isTauriRuntime } from "./tauriRuntime";

export async function openExternalUrl(url: string): Promise<void> {
  if (isTauriRuntime()) {
    try {
      await openUrl(url);
      return;
    } catch (error) {
      console.error("Failed to open external URL via Tauri opener:", error);
    }
  }

  window.open(url, "_blank", "noopener,noreferrer");
}
