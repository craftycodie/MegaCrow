import { translate } from "../localization";
import { TokenKind } from "../tokens";

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
        return translate("expected_number_or_end", { got });
    },

    expectedConstantValue(got: string): string {
        // MegaloEdit.exe: Expected 'true', 'false', or numeric constant name; got '<got>'
        return translate("expected_constant_value", { got });
    },
};
