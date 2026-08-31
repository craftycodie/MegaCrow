import { useMemo } from "react";
import type { MegaloDiagnostic } from "../compile";
import { translate } from "../localization";

export function useDiagnostics(
  analysisDiagnostics: MegaloDiagnostic[],
  missingObjectListNames: readonly string[]
) {
  const objectListDiagnostics = useMemo((): MegaloDiagnostic[] => {
    if (missingObjectListNames.length === 0) {
      return [];
    }
    const listed = missingObjectListNames.join(", ");
    return [
      {
        line: 0,
        column: 0,
        severity: "warning",
        trayOnly: true,
        message:
          missingObjectListNames.length === 1
            ? translate("status_missing_object_list_one", { names: listed })
            : translate("status_missing_object_lists", { names: listed }),
      },
    ];
  }, [missingObjectListNames]);

  const displayDiagnostics = useMemo(
    () => [...analysisDiagnostics, ...objectListDiagnostics],
    [analysisDiagnostics, objectListDiagnostics]
  );

  const warningCount = useMemo(
    () => displayDiagnostics.filter((d) => d.severity === "warning").length,
    [displayDiagnostics]
  );

  return { displayDiagnostics, warningCount };
}
