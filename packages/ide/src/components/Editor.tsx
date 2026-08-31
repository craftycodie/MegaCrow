import MonacoEditor from "@monaco-editor/react";
import { memo } from "react";
import { useMegaloEditor } from "../editor/useMegaloEditor";
import type { MegaloDiagnostic } from "../monaco/megalo-language";
import { DEFAULT_EDITOR_THEME_ID, MEGALO_THEME_ID } from "../monaco/theme";

interface Props {
  diagnostics?: MegaloDiagnostic[];
  documentContent: string;
  editorTheme?: string;
  editorWordWrap?: boolean;
  onCompileDebounced?: (source: string) => void;
  onCursorChange?: (line: number, column: number) => void;
  onEditorWordWrapChange?: (wordWrap: boolean) => void;
  onRegisterGetValue?: (getValue: () => string) => void;
  onRegisterNavigate?: (
    navigate: (line: number, column?: number) => void
  ) => void;
  onSourceDebounced?: (source: string) => void;
  plainText?: boolean;
  readOnly?: boolean;
  syncRevision: number;
}

export const Editor = memo(function Editor(props: Props) {
  const { handleBeforeMount, handleMount, editorOptions, languageId } =
    useMegaloEditor({
      ...props,
      editorTheme: props.editorTheme ?? DEFAULT_EDITOR_THEME_ID,
    });

  return (
    <MonacoEditor
      beforeMount={handleBeforeMount}
      defaultValue={props.documentContent}
      height="100%"
      language={languageId}
      onMount={handleMount}
      options={editorOptions}
      theme={MEGALO_THEME_ID}
    />
  );
});
