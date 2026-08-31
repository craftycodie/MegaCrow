import { revealItemInDir } from "@tauri-apps/plugin-opener";
import { translate } from "../localization";
import { isTauriRuntime } from "./tauriRuntime";

/** Platform-appropriate label for “show this path in the system file manager”. */
export function fileManagerRevealLabel(): string {
  const platform =
    (
      navigator as Navigator & {
        userAgentData?: { platform?: string };
      }
    ).userAgentData?.platform ?? navigator.platform;

  if (/mac/i.test(platform)) {
    return translate("reveal_in_finder");
  }
  if (/win/i.test(platform)) {
    return translate("reveal_in_explorer");
  }
  return translate("reveal_in_files");
}

/** Open the system file manager with `path` selected (desktop / Tauri only). */
export async function revealInFileManager(path: string): Promise<void> {
  if (!isTauriRuntime()) {
    throw new Error(translate("reveal_requires_desktop"));
  }
  await revealItemInDir(path);
}
