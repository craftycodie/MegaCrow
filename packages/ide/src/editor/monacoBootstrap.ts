import { loader } from "@monaco-editor/react";
// Namespace import is required: loader.config expects the monaco module object.
// biome-ignore lint/performance/noNamespaceImport: monaco loader API
import * as monaco from "monaco-editor";
import editorWorker from "monaco-editor/esm/vs/editor/editor.worker?worker";

/**
 * @monaco-editor/react defaults to a separate loader copy of Monaco. Point it at
 * the same `monaco-editor` package Vite bundles so language/services match.
 */
self.MonacoEnvironment = {
  getWorker() {
    return new editorWorker();
  },
};

loader.config({ monaco });
