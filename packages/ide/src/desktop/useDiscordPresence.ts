import { useEffect } from "react";
import type { CompileState } from "../compile";
import { setDiscordPresenceEnabled, updateDiscordPresence } from "../desktop";
import { translate } from "../localization";

interface UseDiscordPresenceOptions {
  compileState: CompileState;
  enabled: boolean;
  fileName: string | null;
  locale: string;
}

export function useDiscordPresence({
  compileState,
  enabled,
  fileName,
  locale,
}: UseDiscordPresenceOptions) {
  useEffect(() => {
    void setDiscordPresenceEnabled(enabled);
  }, [enabled]);

  useEffect(() => {
    if (!enabled) {
      return;
    }

    const details = fileName ?? "MegaloEvolved";
    let state = translate("discord_editing_halo_reach");
    if (fileName) {
      if (compileState === "ok" || compileState === "warn") {
        state =
          compileState === "warn"
            ? translate("discord_compile_warning")
            : translate("discord_script_compiled");
      } else if (compileState === "error") {
        state = translate("discord_compile_errors");
      } else if (compileState === "parsing") {
        state = translate("discord_compiling");
      } else {
        state = translate("discord_editing_gametype");
      }
    }
    void updateDiscordPresence({ details, state });
  }, [compileState, enabled, fileName, locale]);
}
