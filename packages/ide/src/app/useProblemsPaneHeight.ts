import {
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

const STORAGE_KEY = "megacrow.problemsPaneHeight";
export const PROBLEMS_PANE_DEFAULT_HEIGHT = 180;
export const PROBLEMS_PANE_MIN_HEIGHT = 96;
export const PROBLEMS_PANE_MAX_HEIGHT = 480;

function maxHeightForViewport(): number {
  if (typeof window === "undefined") {
    return PROBLEMS_PANE_MAX_HEIGHT;
  }
  // Leave room for toolbar, editor, and status bar.
  return Math.min(
    PROBLEMS_PANE_MAX_HEIGHT,
    Math.max(PROBLEMS_PANE_MIN_HEIGHT, Math.round(window.innerHeight * 0.55))
  );
}

function clampProblemsPaneHeight(height: number): number {
  return Math.min(
    maxHeightForViewport(),
    Math.max(PROBLEMS_PANE_MIN_HEIGHT, Math.round(height))
  );
}

function readStoredHeight(): number {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return PROBLEMS_PANE_DEFAULT_HEIGHT;
    }
    const parsed = Number(raw);
    if (!Number.isFinite(parsed)) {
      return PROBLEMS_PANE_DEFAULT_HEIGHT;
    }
    return clampProblemsPaneHeight(parsed);
  } catch {
    return PROBLEMS_PANE_DEFAULT_HEIGHT;
  }
}

export function useProblemsPaneHeight(): {
  height: number;
  onResizeStart: (event: ReactPointerEvent<HTMLElement>) => void;
} {
  const [height, setHeight] = useState(readStoredHeight);
  const dragRef = useRef<{ startY: number; startHeight: number } | null>(null);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, String(height));
    } catch {
      // ignore quota / private mode
    }
  }, [height]);

  useEffect(() => {
    const onResize = () => {
      setHeight((current) => clampProblemsPaneHeight(current));
    };
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
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
        // Dragging the top edge upward grows the pane.
        const next = clampProblemsPaneHeight(
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

  return { height, onResizeStart };
}
