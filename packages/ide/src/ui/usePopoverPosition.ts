import {
  type RefObject,
  useCallback,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
} from "react";

export interface PopoverPosition {
  bottom?: number;
  left: number;
  top?: number;
}

export interface PopoverPositionOptions {
  alignRight?: boolean;
  direction?: "down" | "up";
  offsetY?: number;
  panelWidth: number;
}

export interface PopoverPositionResult {
  panelPos: PopoverPosition;
  panelRef: RefObject<HTMLDivElement | null>;
  rootRef: RefObject<HTMLDivElement | null>;
  triggerRef: RefObject<HTMLButtonElement | null>;
  updatePanelPosition: () => void;
}

export function usePopoverPosition(
  open: boolean,
  {
    panelWidth,
    alignRight = false,
    direction = "down",
    offsetY = 4,
  }: PopoverPositionOptions
): PopoverPositionResult {
  const [panelPos, setPanelPos] = useState<PopoverPosition>({
    left: 0,
    top: 0,
  });
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  const updatePanelPosition = useCallback(() => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }
    const rect = trigger.getBoundingClientRect();
    const nextLeft = alignRight
      ? Math.min(
          Math.max(8, rect.right - panelWidth),
          Math.max(8, window.innerWidth - panelWidth - 8)
        )
      : Math.min(rect.left, Math.max(8, window.innerWidth - panelWidth - 8));
    if (direction === "up") {
      const nextBottom = Math.max(8, window.innerHeight - rect.top + offsetY);
      setPanelPos((prev) =>
        prev.bottom === nextBottom && prev.left === nextLeft
          ? prev
          : { bottom: nextBottom, left: nextLeft }
      );
      return;
    }
    const nextTop = rect.bottom + offsetY;
    setPanelPos((prev) =>
      prev.top === nextTop && prev.left === nextLeft
        ? prev
        : { top: nextTop, left: nextLeft }
    );
  }, [alignRight, direction, offsetY, panelWidth]);

  useLayoutEffect(() => {
    if (!open) {
      return;
    }
    updatePanelPosition();
  }, [open, updatePanelPosition]);

  useEffect(() => {
    if (!open) {
      return;
    }
    window.addEventListener("resize", updatePanelPosition);
    window.addEventListener("scroll", updatePanelPosition, true);
    return () => {
      window.removeEventListener("resize", updatePanelPosition);
      window.removeEventListener("scroll", updatePanelPosition, true);
    };
  }, [open, updatePanelPosition]);

  return {
    panelPos,
    panelRef,
    rootRef,
    triggerRef,
    updatePanelPosition,
  };
}
