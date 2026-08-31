import {
  showCommandPalette,
  showSourceFileQuickOpen,
} from "../editor/sourceFileQuickOpen";

/**
 * Block browser print and route Ctrl/Cmd+P / Shift+P (and F1) to the IDE palette.
 */
export function installPrintShortcutBlocker(): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.key === "F1") {
      event.preventDefault();
      event.stopPropagation();
      showCommandPalette();
      return;
    }
    if (!(event.ctrlKey || event.metaKey)) {
      return;
    }
    if (event.key.toLowerCase() !== "p") {
      return;
    }
    event.preventDefault();
    event.stopPropagation();
    if (event.shiftKey) {
      showCommandPalette();
    } else {
      showSourceFileQuickOpen();
    }
  };
  window.addEventListener("keydown", onKeyDown, true);
  return () => window.removeEventListener("keydown", onKeyDown, true);
}
