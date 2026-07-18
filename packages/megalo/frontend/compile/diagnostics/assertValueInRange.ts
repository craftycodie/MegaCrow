import type { Diagnostics } from "../../diagnostics";
import type { ValueWithLocation } from "../../intermediate-representation";

export const isWithinRange = (
  value: number,
  min: number,
  max: number
): boolean => value >= min && value <= max;

export function assertValueInRange(
  value: ValueWithLocation<number>,
  min: number,
  max: number,
  diagnostics: Diagnostics
): void {
  if (!isWithinRange(value.valueOf(), min, max)) {
    // TODO: Add a more specific error message.
    diagnostics.addError(
      `Value ${value.valueOf()} is out of range for range ${min} to ${max}.`,
      value.location
    );
  }
}
