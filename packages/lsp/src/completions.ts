import {
  type AnalysisSnapshot,
  completeQuotedPath,
  completionsAtPosition,
  hoverAtPosition,
  type CompletionItem as MegaloCompletionItem,
  type CompletionKind as MegaloCompletionKind,
  type HoverResult as MegaloHoverResult,
  type PathDirectoryEntry,
  type QuotedPathCompletionQuery,
} from "@megacrow/megalo";
import {
  type CompletionItem,
  CompletionItemKind,
  InsertTextFormat,
} from "vscode-languageserver-types";

const toLspCompletionKind = (
  kind: MegaloCompletionKind
): CompletionItemKind => {
  switch (kind) {
    case "keyword":
      return CompletionItemKind.Keyword;
    case "function":
      return CompletionItemKind.Function;
    case "variable":
      return CompletionItemKind.Variable;
    case "enumMember":
      return CompletionItemKind.EnumMember;
    case "constant":
      return CompletionItemKind.Constant;
    case "property":
      return CompletionItemKind.Property;
    case "snippet":
      return CompletionItemKind.Snippet;
    case "file":
      return CompletionItemKind.File;
    case "folder":
      return CompletionItemKind.Folder;
    default:
      return CompletionItemKind.Text;
  }
};

const TRIGGER_SUGGEST_COMMAND = {
  title: "Suggest",
  command: "editor.action.triggerSuggest",
  arguments: [{ auto: true }],
};

const ENTER_BLOCK_BODY_COMMAND = {
  title: "Move into block body",
  command: "megacrow.enterBlockBodyAndSuggest",
} as const;

const toLspCompletionItems = (
  items: MegaloCompletionItem[]
): CompletionItem[] =>
  items.map((entry) => ({
    label: entry.label,
    kind: toLspCompletionKind(entry.kind),
    detail: entry.detail,
    insertText: entry.insertText,
    sortText: entry.sortText,
    filterText: entry.filterText,
    ...(entry.insertAsSnippet
      ? { insertTextFormat: InsertTextFormat.Snippet }
      : {}),
    ...(entry.enterBlockBodyAfterAccept
      ? { command: ENTER_BLOCK_BODY_COMMAND }
      : entry.triggerSuggestAfterAccept
        ? { command: TRIGGER_SUGGEST_COMMAND }
        : {}),
    ...(entry.documentation === undefined
      ? {}
      : {
          documentation: {
            kind: "markdown",
            value: entry.documentation,
          },
        }),
  }));

export const completionsFromSnapshot = (
  snapshot: AnalysisSnapshot,
  position: { line: number; character: number }
): CompletionItem[] =>
  toLspCompletionItems(completionsAtPosition(snapshot, position));

export const hoverFromSnapshot = (
  snapshot: AnalysisSnapshot,
  position: { line: number; character: number }
): MegaloHoverResult | null => hoverAtPosition(snapshot, position);

export const pathCompletionsFromEntries = (
  query: QuotedPathCompletionQuery,
  entries: readonly PathDirectoryEntry[]
): CompletionItem[] => toLspCompletionItems(completeQuotedPath(query, entries));
