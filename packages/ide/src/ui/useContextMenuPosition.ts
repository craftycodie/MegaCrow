import { type RefObject, useEffect, useLayoutEffect, useRef } from "react";

export interface ContextMenuPositionOptions {
  closeOnResize?: boolean;
  closeOnScroll?: boolean;
}

export function useContextMenuPosition(
  menu: { x: number; y: number } | null,
  onClose: () => void,
  {
    closeOnResize = true,
    closeOnScroll = true,
  }: ContextMenuPositionOptions = {}
): RefObject<HTMLDivElement | null> {
  const panelRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!(menu && panelRef.current)) {
      return;
    }
    const rect = panelRef.current.getBoundingClientRect();
    const maxLeft = Math.max(8, window.innerWidth - rect.width - 8);
    const maxTop = Math.max(8, window.innerHeight - rect.height - 8);
    panelRef.current.style.left = `${Math.min(menu.x, maxLeft)}px`;
    panelRef.current.style.top = `${Math.min(menu.y, maxTop)}px`;
  }, [menu]);

  useEffect(() => {
    if (!menu) {
      return;
    }

    const onPointerDown = (event: globalThis.MouseEvent) => {
      if (panelRef.current?.contains(event.target as Node)) {
        return;
      }
      onClose();
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        onClose();
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    if (closeOnScroll) {
      window.addEventListener("scroll", onClose, true);
    }
    if (closeOnResize) {
      window.addEventListener("resize", onClose);
    }
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
      if (closeOnScroll) {
        window.removeEventListener("scroll", onClose, true);
      }
      if (closeOnResize) {
        window.removeEventListener("resize", onClose);
      }
    };
  }, [closeOnResize, closeOnScroll, menu, onClose]);

  return panelRef;
}
