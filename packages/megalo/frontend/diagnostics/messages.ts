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
};
