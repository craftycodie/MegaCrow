import { useCallback, useRef, useState } from "react";
import { CURRENT_MOTD, recordMotdView, shouldShowMotdOnStartup } from "./motd";

export function useMotd() {
  const initialMotdOpen = shouldShowMotdOnStartup();
  const motdCountsViewRef = useRef(initialMotdOpen);
  const [motdOpen, setMotdOpen] = useState(initialMotdOpen);

  const handleMotdDismiss = useCallback(() => {
    if (motdCountsViewRef.current) {
      recordMotdView(CURRENT_MOTD.id);
    }
    motdCountsViewRef.current = false;
    setMotdOpen(false);
  }, []);

  const showMotdPreview = useCallback(() => {
    motdCountsViewRef.current = false;
    setMotdOpen(true);
  }, []);

  return { handleMotdDismiss, motdOpen, showMotdPreview };
}
