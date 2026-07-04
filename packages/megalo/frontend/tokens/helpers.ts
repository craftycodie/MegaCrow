import { Tokens } from ".";
import { SourceCodeLocation } from "../diagnostics";

/// <summary>
/// Returns the location of a span of tokens.
/// </summary>
/// <param name="tokens">The tokens to get the location of.</param>
/// <returns>The location of the span of tokens.</returns>
export const spanLocation = (tokens: Tokens): SourceCodeLocation => {
    return {
        start: tokens[0].location.start,
        end: tokens[tokens.length - 1].location.end,
    };
}