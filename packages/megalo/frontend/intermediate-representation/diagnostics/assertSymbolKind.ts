import { BUILT_IN_LOCATION } from "../../diagnostics";
import { SymbolKind, SymbolTableEntry } from "../../symbol-table";
import { LowerError } from "../error";
import { diagnosticMessages } from "../../diagnostics/messages";

export function assertSymbolKind<K extends SymbolKind>(
    symbol: SymbolTableEntry | undefined,
    kind: K
): asserts symbol is Extract<SymbolTableEntry, { kind: K }> {
    if (symbol === undefined) {
        // TODO: make a proper error message
        throw new LowerError("Symbol not found", BUILT_IN_LOCATION);
    }
    if (symbol.kind !== kind) {
        // TODO: make a proper error message
        throw new LowerError(
            diagnosticMessages.expectedOneOf([String(kind)], String(symbol.kind)),
            symbol.range
        );
    }
}