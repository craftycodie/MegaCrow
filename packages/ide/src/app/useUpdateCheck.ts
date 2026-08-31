import { MEGACROW_BUILD_STRING } from "@megacrow/megalo";
import { useCallback, useEffect, useRef, useState } from "react";
import { isTauriRuntime } from "../desktop";
import { type MegacrowSettings, mergeAppSettings } from "../workspace";
import { checkForAppUpdate, type GithubReleaseInfo } from "./updateCheck";

interface UseUpdateCheckOptions {
  commitSettings: (next: MegacrowSettings) => Promise<void>;
  megacrowSettings: MegacrowSettings | null;
  motdOpen: boolean;
  workspacesReady: boolean;
}

export function useUpdateCheck({
  commitSettings,
  megacrowSettings,
  motdOpen,
  workspacesReady,
}: UseUpdateCheckOptions) {
  const [updateRelease, setUpdateRelease] = useState<GithubReleaseInfo | null>(
    null
  );
  const [updateOpen, setUpdateOpen] = useState(false);
  const updateCheckDoneRef = useRef(false);

  useEffect(() => {
    if (updateCheckDoneRef.current || !workspacesReady || !megacrowSettings) {
      return;
    }
    if (!isTauriRuntime()) {
      updateCheckDoneRef.current = true;
      return;
    }

    let cancelled = false;
    updateCheckDoneRef.current = true;
    void checkForAppUpdate({
      currentBuildString: MEGACROW_BUILD_STRING,
      skippedUpdateVersion: megacrowSettings.skippedUpdateVersion,
    }).then((result) => {
      if (cancelled || result.kind !== "available") {
        return;
      }
      setUpdateRelease(result.release);
    });

    return () => {
      cancelled = true;
    };
  }, [megacrowSettings, workspacesReady]);

  useEffect(() => {
    if (!updateRelease || motdOpen) {
      setUpdateOpen(false);
      return;
    }
    setUpdateOpen(true);
  }, [motdOpen, updateRelease]);

  const handleUpdateDismiss = useCallback(() => {
    setUpdateOpen(false);
    setUpdateRelease(null);
  }, []);

  const handleUpdateSkip = useCallback(() => {
    if (!(megacrowSettings && updateRelease)) {
      setUpdateOpen(false);
      setUpdateRelease(null);
      return;
    }
    const next = mergeAppSettings(megacrowSettings, {
      skippedUpdateVersion: updateRelease.tagName,
    });
    setUpdateOpen(false);
    setUpdateRelease(null);
    void commitSettings(next);
  }, [commitSettings, megacrowSettings, updateRelease]);

  return {
    handleUpdateDismiss,
    handleUpdateSkip,
    updateOpen,
    updateRelease,
  };
}
