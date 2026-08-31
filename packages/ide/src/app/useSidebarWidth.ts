import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const WIDTH_STORAGE_KEY = "megacrow.sidebarWidth";
const OPEN_STORAGE_KEY = "megacrow.sidebarOpen";
export const SIDEBAR_DEFAULT_WIDTH = 280;
export const SIDEBAR_MIN_WIDTH = 200;
export const SIDEBAR_MAX_WIDTH = 480;

function clampSidebarWidth(width: number): number {
  return Math.min(
    SIDEBAR_MAX_WIDTH,
    Math.max(SIDEBAR_MIN_WIDTH, Math.round(width))
  );
}

function readStoredWidth(): number {
  try {
    const raw = localStorage.getItem(WIDTH_STORAGE_KEY);
    if (!raw) {
      return SIDEBAR_DEFAULT_WIDTH;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      return SIDEBAR_DEFAULT_WIDTH;
    }
    return clampSidebarWidth(parsed);
  } catch {
    return SIDEBAR_DEFAULT_WIDTH;
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

export function useSidebarWidth(): {
  width: number;
  open: boolean;
  toggleOpen: () => void;
  onResizeStart: (event: ReactPointerEvent<HTMLElement>) => void;
} {
  const [width, setWidth] = useState(readStoredWidth);
  const [open, setOpen] = useState(readStoredOpen);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(WIDTH_STORAGE_KEY, String(width));
    } catch {
      // ignore quota / private mode
    }
  }, [width]);

  useEffect(() => {
    try {
      localStorage.setItem(OPEN_STORAGE_KEY, open ? "1" : "0");
    } catch {
      // ignore quota / private mode
    }
  }, [open]);

  const toggleOpen = useCallback(() => {
    setOpen((prev) => !prev);
  }, []);

  const onResizeStart = useCallback(
    (event: ReactPointerEvent<HTMLElement>) => {
      event.preventDefault();
      dragRef.current = { startX: event.clientX, startWidth: width };

      const onMove = (moveEvent: PointerEvent) => {
        const drag = dragRef.current;
        if (!drag) {
          return;
        }
        const next = clampSidebarWidth(
          drag.startWidth + (moveEvent.clientX - drag.startX)
        );
        setWidth(next);
      };

      const onUp = () => {
        dragRef.current = null;
        window.removeEventListener("pointermove", onMove);
        window.removeEventListener("pointerup", onUp);
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      };

      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      window.addEventListener("pointermove", onMove);
      window.addEventListener("pointerup", onUp);
    },
    [width]
  );

  return { width, open, toggleOpen, onResizeStart };
}
