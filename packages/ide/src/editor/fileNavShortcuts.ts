/** Wire OS / mouse history navigation to MegaCrow file Back / Forward. */
export function installFileNavShortcuts(options: {
  canGoBack: () => boolean;
  canGoForward: () => boolean;
  goBack: () => void;
  goForward: () => void;
}): () => void {
  const onKeyDown = (event: KeyboardEvent) => {
    if (event.defaultPrevented) {
      return;
    }
    // Hardware browser keys (and some keyboards / mice that emit them).
    if (event.key === "BrowserBack" || event.code === "BrowserBack") {
      event.preventDefault();
      if (options.canGoBack()) {
        options.goBack();
      }
      return;
    }
    if (event.key === "BrowserForward" || event.code === "BrowserForward") {
      event.preventDefault();
      if (options.canGoForward()) {
        options.goForward();
      }
    }
  };

  // Mouse back (3) / forward (4). Prevent the host browser/webview history jump.
  const onMouseDown = (event: MouseEvent) => {
    if (event.button === 3 || event.button === 4) {
      event.preventDefault();
    }
  };

  const onMouseUp = (event: MouseEvent) => {
    if (event.button === 3) {
      event.preventDefault();
      if (options.canGoBack()) {
        options.goBack();
      }
      return;
    }
    if (event.button === 4) {
      event.preventDefault();
      if (options.canGoForward()) {
        options.goForward();
      }
    }
  };

  window.addEventListener("keydown", onKeyDown, true);
  window.addEventListener("mousedown", onMouseDown, true);
  window.addEventListener("mouseup", onMouseUp, true);
  return () => {
    window.removeEventListener("keydown", onKeyDown, true);
    window.removeEventListener("mousedown", onMouseDown, true);
    window.removeEventListener("mouseup", onMouseUp, true);
  };
}
