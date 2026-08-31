import { isMccMegaloVersion } from "@megacrow/megalo";
import { useCallback, useEffect, useState } from "react";
import {
  detectMccInstall,
  isTauriRuntime,
  launchGameCommand,
  launchMcc,
} from "../desktop";
import { translateLaunchError } from "../localization";
import type { Workspace } from "../workspace";

interface Options {
  workspace: Workspace | null;
}

export function useMccLaunch({ workspace }: Options) {
  const frameless = isTauriRuntime();
  const [mccInstalled, setMccInstalled] = useState(false);
  const [launching, setLaunching] = useState(false);

  const launchCommand = workspace?.gameLaunchCommand?.trim() ?? "";
  const hasLaunchCommand = launchCommand.length > 0;
  const isMccFlavour =
    workspace === null || isMccMegaloVersion(workspace.megaloVersion);
  const showCustomLaunch = frameless && hasLaunchCommand;
  const showMccLaunch = frameless && isMccFlavour && !hasLaunchCommand;
  const launchUnavailable = frameless && !isMccFlavour && !hasLaunchCommand;

  useEffect(() => {
    if (!showMccLaunch) {
      setMccInstalled(false);
      return;
    }

    let cancelled = false;
    void detectMccInstall().then((info) => {
      if (!cancelled) {
        setMccInstalled(info.installed);
      }
    });

    return () => {
      cancelled = true;
    };
  }, [showMccLaunch]);

  const handleLaunch = useCallback(async () => {
    if (launching || launchUnavailable) {
      return;
    }
    if (showCustomLaunch) {
      setLaunching(true);
      try {
        await launchGameCommand(launchCommand);
      } catch (error) {
        console.error("Failed to launch game:", translateLaunchError(error));
      } finally {
        setLaunching(false);
      }
      return;
    }
    if (!mccInstalled) {
      return;
    }
    setLaunching(true);
    try {
      await launchMcc();
    } catch (error) {
      console.error("Failed to launch Halo MCC:", translateLaunchError(error));
    } finally {
      setLaunching(false);
    }
  }, [
    launchCommand,
    launchUnavailable,
    launching,
    mccInstalled,
    showCustomLaunch,
  ]);

  return {
    frameless,
    handleLaunch,
    launchCommand,
    launchUnavailable,
    launching,
    mccInstalled,
    showCustomLaunch,
    showMccLaunch,
  };
}
