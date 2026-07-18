import type { Diagnostics } from "../../diagnostics";
import type { ValueWithLocation } from "../../intermediate-representation";

export const isWithinBitLength = (value: number, bitLength: number): boolean =>
  value >= 0 && value < 1 << bitLength;

export function assertValidBitLength(
  value: ValueWithLocation<number>,
  bitLength: number,
  diagnostics: Diagnostics
): void {
  if (!isWithinBitLength(value.valueOf(), bitLength)) {
    // TODO: Add a more specific error message.
    diagnostics.addError(
      `Value ${value.valueOf()} is out of range for bit length ${bitLength}.`,
      value.location
    );
  }
}
