import "./editor/monacoBootstrap";
import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import {
  installNativeContextMenuBlocker,
  installPrintShortcutBlocker,
} from "./desktop";
import "./styles.css";

installPrintShortcutBlocker();
installNativeContextMenuBlocker();

createRoot(document.getElementById("root")!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
