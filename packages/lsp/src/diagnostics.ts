import {
  analyzeObjectListSource,
  getConfigurationForVersion,
  type Diagnostic as MegaloDiagnostic,
  DiagnosticSeverity as MegaloSeverity,
  OBJECT_LIST_DIAGNOSTIC_KIND,
  type ObjectListDiagnosticData,
  SourceLocationType,
  type SupportedMegaloVersion,
  summarizeIncludeDiagnostics,
} from "@megacrow/megalo";
import {
  type Diagnostic,
  DiagnosticSeverity,
} from "vscode-languageserver-types";
import type {
  MegacrowAnalyzeObjectListResult,
  MegacrowVersionConfigurationResult,
} from "./protocol";

export const versionConfigurationFor = (
  version: SupportedMegaloVersion
): MegacrowVersionConfigurationResult => {
  const configuration = getConfigurationForVersion(version);
  return {
    objectListNames: [...configuration.objectListNames],
  };
};

export const analyzeObjectListFor = (
  source: string,
  version: SupportedMegaloVersion
): MegacrowAnalyzeObjectListResult => ({
  diagnostics: toLspDiagnostics(analyzeObjectListSource(source, { version })),
});

export const toLspDiagnostics = (
  diagnostics: MegaloDiagnostic[],
  source?: string
): Diagnostic[] =>
  summarizeIncludeDiagnostics(diagnostics, source).flatMap(
    (d: MegaloDiagnostic) => {
      const severity =
        d.severity === MegaloSeverity.Error
          ? DiagnosticSeverity.Error
          : d.severity === MegaloSeverity.Warning
            ? DiagnosticSeverity.Warning
            : DiagnosticSeverity.Information;

      if (d.location.type === SourceLocationType.SOURCE_CODE) {
        const { start, end } = d.location;
        return [
          {
            severity,
            message: d.message,
            range: {
              start: {
                line: Math.max(0, start.line - 1),
                character: Math.max(0, start.column - 1),
              },
              end: {
                line: Math.max(0, end.line - 1),
                character: Math.max(0, end.column - 1),
              },
            },
          },
        ];
      }

      if (d.location.type === SourceLocationType.INCLUDE) {
        const { start, end } = d.location.declaration;
        return [
          {
            severity,
            message: d.message,
            range: {
              start: {
                line: Math.max(0, start.line - 1),
                character: Math.max(0, start.column - 1),
              },
              end: {
                line: Math.max(0, end.line - 1),
                character: Math.max(0, end.column - 1),
              },
            },
          },
        ];
      }

      if (d.location.type === SourceLocationType.OBJECT_LIST) {
        const data: ObjectListDiagnosticData = {
          kind: OBJECT_LIST_DIAGNOSTIC_KIND,
          objectType: d.location.objectType,
          line0: Math.max(0, d.location.source.line),
          ...(d.location.file === undefined ? {} : { file: d.location.file }),
        };
        return [
          {
            severity,
            message: d.message,
            range: {
              start: { line: 0, character: 0 },
              end: { line: 0, character: 0 },
            },
            data,
          },
        ];
      }

      return [
        {
          severity,
          message: d.message,
          range: {
            start: { line: 0, character: 0 },
            end: { line: 0, character: 0 },
          },
        },
      ];
    }
  );
