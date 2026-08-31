import {
  readText as readTauriClipboardText,
  writeText as writeTauriClipboardText,
} from "@tauri-apps/plugin-clipboard-manager";
import { isTauriRuntime } from "./tauriRuntime";

/** System clipboard text — Tauri plugin avoids the webview permission prompt. */
export async function writeClipboardText(text: string): Promise<void> {
  if (isTauriRuntime()) {
    await writeTauriClipboardText(text);
    return;
  }
  await navigator.clipboard.writeText(text);
}

export async function readClipboardText(): Promise<string | null> {
  try {
    if (isTauriRuntime()) {
      return await readTauriClipboardText();
    }
    return await navigator.clipboard.readText();
  } catch {
    return null;
  }
}
