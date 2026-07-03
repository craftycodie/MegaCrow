import { translate } from "../localization";
import { TokenKind } from "../tokens";

export const diagnosticMessages = {
    expectedElement(value: string): string {
        return translate("expected_element", { value });
    },

    expectedQuotedString(kind: TokenKind, value: string): string {
        const kindName = TokenKind[kind] ?? String(kind);
        return translate("expected_quoted_string", { kind: kindName, token: value });
    },
};
