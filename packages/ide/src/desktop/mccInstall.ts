import { ipcDetectMccInstall, ipcLaunchGameCommand, ipcLaunchMcc } from "./ipc";
import { isTauriRuntime } from "./tauriRuntime";

export type MccInstallSource = "steam" | "microsoft_store";

export interface MccInstallInfo {
  installed: boolean;
  installPath: string | null;
  source: MccInstallSource | null;
}

const NOT_INSTALLED: MccInstallInfo = {
  installed: false,
  source: null,
  installPath: null,
};

export async function detectMccInstall(): Promise<MccInstallInfo> {
  if (!isTauriRuntime()) {
    return NOT_INSTALLED;
  }

  try {
    return (await ipcDetectMccInstall()) as MccInstallInfo;
  } catch {
    return NOT_INSTALLED;
  }
}

export async function launchMcc(): Promise<void> {
  if (!isTauriRuntime()) {
    throw new Error("Launching Halo MCC is only available in the desktop app");
  }

  await ipcLaunchMcc();
}

export async function launchGameCommand(command: string): Promise<void> {
  if (!isTauriRuntime()) {
    throw new Error("Launching the game is only available in the desktop app");
  }

  await ipcLaunchGameCommand(command);
}
