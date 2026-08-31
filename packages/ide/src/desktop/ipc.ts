import { invoke } from "@tauri-apps/api/core";
import type { MegacrowSettings } from "../workspace/megacrowSettings";
import { isTauriRuntime } from "./tauriRuntime";

/** Discord RPC uses snake_case `presence_state` on the wire; other commands use camelCase. */
export async function ipcUpdateDiscordPresence(options: {
  details?: string;
  state?: string;
}): Promise<void> {
  if (!isTauriRuntime()) {
    return;
  }
  try {
    await invoke("update_discord_presence", {
      details: options.details,
      presence_state: options.state,
    });
  } catch {
    // Discord may be closed or RPC unavailable.
  }
}

export async function ipcSetDiscordPresenceEnabled(
  enabled: boolean
): Promise<void> {
  if (!isTauriRuntime()) {
    return;
  }
  try {
    await invoke("set_discord_presence_enabled", { enabled });
  } catch {
    // Discord may be closed or RPC unavailable.
  }
}

export async function ipcGetDiscordUsername(): Promise<string | null> {
  if (!isTauriRuntime()) {
    return null;
  }
  try {
    const username = await invoke<string | null>("get_discord_username");
    const trimmed = username?.trim();
    return trimmed ? trimmed : null;
  } catch {
    return null;
  }
}

export async function ipcWriteMccHotReloadMglo(
  bytes: Uint8Array
): Promise<string> {
  return invoke<string>("write_mcc_hot_reload_mglo", {
    data: Array.from(bytes),
  });
}

export async function ipcDetectMccInstall(): Promise<unknown> {
  if (!isTauriRuntime()) {
    return null;
  }
  return invoke("detect_mcc_install");
}

export async function ipcLaunchMcc(): Promise<void> {
  if (!isTauriRuntime()) {
    return;
  }
  await invoke("launch_mcc");
}

export async function ipcLaunchGameCommand(command: string): Promise<void> {
  if (!isTauriRuntime()) {
    return;
  }
  await invoke("launch_game_command", { command });
}

export async function ipcLoadMegacrowSettings(): Promise<MegacrowSettings | null> {
  return invoke<MegacrowSettings | null>("load_megacrow_settings");
}

export async function ipcSaveMegacrowSettings(
  settings: MegacrowSettings
): Promise<void> {
  await invoke("save_megacrow_settings", { settings });
}

export async function ipcDiscoverHrekWorkspaces(): Promise<
  import("../workspace/megacrowSettings").DiscoveredWorkspace[]
> {
  if (!isTauriRuntime()) {
    return [];
  }
  return invoke("discover_hrek_workspaces");
}

export async function ipcRegenerateObjectListsWithTool(
  editingKitRoot: string,
  objectListsDir: string
): Promise<void> {
  await invoke("regenerate_object_lists_with_tool", {
    editingKitRoot,
    objectListsDir,
  });
}

export async function ipcClipboardWriteFiles(options: {
  paths: string[];
  text?: string;
}): Promise<void> {
  await invoke("clipboard_write_files", options);
}

export async function ipcCliLog(level: string, line: string): Promise<void> {
  await invoke("cli_log", { level, line });
}

export async function ipcCliComplete(code: number): Promise<void> {
  await invoke("cli_complete", { code });
}

export async function ipcGetCliArgs(): Promise<string[]> {
  return invoke<string[]>("get_cli_args");
}
