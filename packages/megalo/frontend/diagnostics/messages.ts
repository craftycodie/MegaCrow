import { formatAlternatives, translate } from "../localization";
import { TokenKind } from "../tokens";

const expectedOneOf = (alternatives: readonly string[], got: string): string =>
    translate("expected_one_of", { expected: formatAlternatives(alternatives), got });

export const diagnosticMessages = {
    expectedElement(value: string): string {
        return translate("expected_element", { value });
    },

    expectedTokenKind(expected: TokenKind, kind: TokenKind, value: string): string {
        // MegaloEdit.exe: Expected token of type <expected>, got one of type <type>: '<token>'
        const expectedName = TokenKind[expected] ?? String(expected);
        const kindName = TokenKind[kind] ?? String(kind);
        return translate("expected_token_kind", { expected: expectedName, kind: kindName, token: value });
    },

    expectedEndBeforeEof(): string {
        // MegaloEdit.exe: Reached end of file reading string table
        return translate("expected_end_before_eof");
    },

    stringAlreadyDefined(language: string, identifier: string): string {
        // MegaloEdit.exe: String table for language <language> already has a string for token <identifier> defined
        return translate("string_already_defined", { language, identifier });
    },

    expectedNumberOrEnd(got: string): string {
        // MegaloEdit.exe: Expected 'number' or 'end' but got '<got>'
        return expectedOneOf(["'number'", "'end'"], got);
    },

    expectedConstantValue(got: string): string {
        // MegaloEdit.exe: Expected 'true', 'false', or numeric constant name; got '<got>'
        return expectedOneOf(["'true'", "'false'", translate("numeric_constant_name")], got);
    },

    expectedVariableNetworkOrEnd(got: string): string {
        // MegaloEdit.exe: Expected 'local', 'networked', 'networked_high' or 'end' but got '<got>'
        return expectedOneOf(["'local'", "'networked'", "'networked_high'", "'end'"], got);
    },

    expectedVariableType(got: string): string {
        // MegaloEdit.exe: Expected 'timer', 'number', 'team', 'player', or 'object', but got '<got>'
        return expectedOneOf(["'timer'", "'number'", "'team'", "'player'", "'object'"], got);
    },

    expectedGameOptionElement(got: string): string {
        return expectedOneOf(
            ["'override'", "'option'", "'ranged_option'", "'player_traits'", "'lock'", "'hide'", "'end'"],
            got,
        );
    },

    invalidStringIdentifier(identifier: string): string {
        // MegaloEdit.exe: Invalid string identifier '<token>'
        return translate("invalid_string_identifier", { identifier });
    },

    expectedVariableReference(got: string): string {
        return expectedOneOf([translate("variable_reference")], got);
    },

    expectedParameterType(expected: string, got: string): string {
        return translate("expected_parameter_type", { expected, got });
    },

    unknownPlayerTrait(got: string): string {
        // MegaloEdit.exe: Expected player trait modifier, got '<token>'
        return translate("unknown_player_trait", { got });
    },
};
