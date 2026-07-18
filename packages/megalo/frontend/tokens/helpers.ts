import { type SourceCodeLocation, SourceLocationType } from "../diagnostics";
import type { Tokens } from ".";

/// <summary>
/// Returns the location of a span of tokens.
/// </summary>
/// <param name="tokens">The tokens to get the location of.</param>
/// <returns>The location of the span of tokens.</returns>
export const spanLocation = (tokens: Tokens): SourceCodeLocation => ({
  type: SourceLocationType.SOURCE_CODE,
  start: tokens[0].location.start,
  end: tokens[tokens.length - 1].location.end,
});
