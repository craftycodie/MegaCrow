import { ipcWriteMccHotReloadMglo } from "./ipc";
import { isTauriRuntime } from "./tauriRuntime";

export const MCC_HOT_RELOAD_MGLO_PATH =
  "%LOCALAPPDATA%/../LocalLow/MCC/Temporary/HaloReach/HotReload/.mglo";

export { isTauriRuntime };

export async function writeMccHotReloadMglo(bytes: Uint8Array): Promise<void> {
  if (!isTauriRuntime()) {
    return;
  }
  const path = await ipcWriteMccHotReloadMglo(bytes);
  console.log(
    `[MegaCrow] Wrote MCC hot-reload .mglo (${bytes.length} bytes) -> ${path}`
  );
}
