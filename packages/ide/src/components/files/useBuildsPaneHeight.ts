import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "megacrow.buildsPaneHeight";
const OPEN_STORAGE_KEY = "megacrow.buildsPaneOpen";
export const BUILDS_PANE_DEFAULT_HEIGHT = 112;
export const BUILDS_PANE_MIN_HEIGHT = 72;
export const BUILDS_PANE_MAX_HEIGHT = 360;

function clampBuildsPaneHeight(height: number): number {
  return Math.min(
    BUILDS_PANE_MAX_HEIGHT,
    Math.max(BUILDS_PANE_MIN_HEIGHT, Math.round(height))
  );
}

function readStoredHeight(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return BUILDS_PANE_DEFAULT_HEIGHT;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      return BUILDS_PANE_DEFAULT_HEIGHT;
    }
    return clampBuildsPaneHeight(parsed);
  } catch {
    return BUILDS_PANE_DEFAULT_HEIGHT;
  }
}

function readStoredOpen(): boolean {
  try {
    const raw = localStorage.getItem(OPEN_STORAGE_KEY);
    if (raw === null) {
      return true;
    }
    return raw !== "0" && raw !== "false";
  } catch {
    return true;
  }
}

export function useBuildsPaneHeight(): {
  height: number;
  open: boolean;
  onResizeStart: (event: ReactPointerEvent<HTMLElement>) => void;
  toggleOpen: () => void;
} {
  const [height, setHeight] = useState(readStoredHeight);
  const [open, setOpen] = useState(readStoredOpen);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(height));
    } catch {
      // ignore
    }
  }, [height]);

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_STORAGE_KEY, open ? "1" : "0");
    } catch {
      // ignore
    }
  }, [open]);

  const toggleOpen = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const onResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      event.preventDefault();
      dragRef.current = { startY: event.clientY, startHeight: height };

      const onMove = (moveEvent: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag) {
          return;
        }
        // Dragging the top edge upward grows the builds pane.
        const next = clampBuildsPaneHeight(
          drag.startHeight - (moveEvent.clientY - drag.startY)
        );
        setHeight(next);
      };

      const onUp = () => {
        dragRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [height]
  );

  return { height, open, onResizeStart, toggleOpen };
}
