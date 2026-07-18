import { ValueWithLocation } from "..";
import { Diagnostics, SourceLocationType } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";

export const markCurrentValueUnused = (
    value: ValueWithLocation<unknown> | undefined,
    diagnostics: Diagnostics
) => {
    if (value === undefined || value === null) {
        return;
    }
    // Built-in defaults are not user-authored; don't warn when overridden.
    if (value.location.type === SourceLocationType.BUILT_IN) {
        return;
    }
    diagnostics.addWarning(
        diagnosticMessages.unusedValue(value.location),
        value.location
    );
};