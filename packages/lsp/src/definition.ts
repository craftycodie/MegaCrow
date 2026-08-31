import { type AnalysisSnapshot, definitionAtPosition } from "@megacrow/megalo";
import type { LocationLink } from "vscode-languageserver-types";
import { MEGACROW_DEFINITION_SCHEME } from "./protocol";

export const definitionFromSnapshot = (
  snapshot: AnalysisSnapshot,
  documentUri: string,
  position: { line: number; character: number }
): LocationLink[] => {
  const target = definitionAtPosition(snapshot, position);
  if (!target) {
    return [];
  }

  if (target.kind === "current") {
    return [
      {
        targetUri: documentUri,
        targetRange: target.range,
        targetSelectionRange: target.range,
      },
    ];
  }

  const query = new URLSearchParams({
    file: target.file,
    line: String(target.range.start.line),
    character: String(target.range.start.character),
  });
  const targetUri = `${MEGACROW_DEFINITION_SCHEME}:/goto?${query.toString()}`;
  return [
    {
      targetUri,
      targetRange: target.range,
      targetSelectionRange: target.range,
    },
  ];
};
