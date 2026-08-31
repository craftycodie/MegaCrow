/** System monospace stack — avoids webfont metric mismatch with Monaco’s caret in Tauri/WebView2. */
export const EDITOR_FONT_FAMILY =
  '"Cascadia Mono", "Cascadia Code", Consolas, ui-monospace, monospace';

export const EDITOR_FONT_SIZE = 14;

/** Match Monaco’s default ratio; explicit value keeps caret aligned after font changes. */
export const EDITOR_LINE_HEIGHT = Math.round(EDITOR_FONT_SIZE * 1.5);
