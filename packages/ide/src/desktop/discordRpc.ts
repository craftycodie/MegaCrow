import {
  ipcGetDiscordUsername,
  ipcSetDiscordPresenceEnabled,
  ipcUpdateDiscordPresence,
} from "./ipc";

export async function updateDiscordPresence(options: {
  details?: string;
  state?: string;
}): Promise<void> {
  return ipcUpdateDiscordPresence(options);
}

export async function setDiscordPresenceEnabled(
  enabled: boolean
): Promise<void> {
  return ipcSetDiscordPresenceEnabled(enabled);
}

/** Discord display name from IPC READY; null on web or when Discord is unavailable. */
export async function getDiscordUsername(): Promise<string | null> {
  return ipcGetDiscordUsername();
}
