/** Suppress the browser/WebView native context menu for the whole IDE. */
export function installNativeContextMenuBlocker(): () => void {
  const onContextMenu = (event: Event) => {
    event.preventDefault();
  };
  window.addEventListener("contextmenu", onContextMenu, true);
  return () => window.removeEventListener("contextmenu", onContextMenu, true);
}
