import { SourceLocation } from "../diagnostics/source";

// #region Types

// Modelled based on Bungie.Megalo.TokenKind
export enum TokenKind
{
    None,
    Identifier,
    MemberVariableSeparator,
    QuotedString,   
    Integer,
    FloatingPoint,
    Comment
}

export type Token = {
    kind: TokenKind;
    value: string;
    location: SourceLocation;
}

export type Tokens = Token[];

// #endregion

// #region Character Code and Class Lookup Tables

const CharCode = {
    Semicolon: ";".charCodeAt(0),
    Quote: '"'.charCodeAt(0),
    Backslash: "\\".charCodeAt(0),
    Dot: ".".charCodeAt(0),
    Minus: "-".charCodeAt(0),
    LineFeed: "\n".charCodeAt(0),
    CarriageReturn: "\r".charCodeAt(0),
} as const;

// Bitmask for character classes
const Char = {
    Whitespace: 1 << 0,
    IdentStart: 1 << 1,
    Ident: 1 << 2,
    Digit: 1 << 3,
} as const;

// Lookup table of character classes
// Anything outside of ASCII is only valid in quoted strings, which we handle separately
const lexerCharsetTable = new Uint8Array(256);
for (const ch of " \t\n\r") {
    lexerCharsetTable[ch.charCodeAt(0)] |= Char.Whitespace;
}
for (const ch of "abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ_") {
    lexerCharsetTable[ch.charCodeAt(0)] |= Char.IdentStart | Char.Ident;
}
for (const ch of "0123456789") {
    lexerCharsetTable[ch.charCodeAt(0)] |= Char.Digit | Char.Ident;
}

// #endregion

const classifyNumeric = (text: string): TokenKind.Integer | TokenKind.FloatingPoint | TokenKind.None => {
    if (text.length === 0) {
        return TokenKind.None;
    }

    let index = 0;
    if (text.charCodeAt(0) === CharCode.Minus) {
        index = 1;
    }
    if (index >= text.length) {
        return TokenKind.None;
    }

    let allDigits = true;
    for (; index < text.length; index++) {
        if ((lexerCharsetTable[text.charCodeAt(index)] & Char.Digit) === 0) {
            allDigits = false;
            break;
        }
    }

    if (allDigits) {
        return TokenKind.Integer;
    }

    const value = Number(text);
    return Number.isNaN(value) ? TokenKind.None : TokenKind.FloatingPoint;
};

/**
 * Unescape a Megalo quoted string body.
 *
 * Megalo supports the following escape characters: `\n`, `\r`, `\t`, `\\`, `\"`.
 * If a backslash is followed by a character that is not one of the above,
 * the backslash is removed and the character is preserved.
 */
const unescapeQuotedString = (raw: string): string => {
    return raw.replace(/\\(.)/g, (_match, ch: string) => {
        switch (ch) {
            case "n": return "\n";
            case "r": return "\r";
            case "t": return "\t";
            case "\\": return "\\";
            case "\"": return "\"";
            default: return ch;
        }
    });
};

export const lex = (source: string): Tokens => {
    const tokens: Tokens = [];
    const length = source.length;
    let index = 0;
    let line = 1;
    let column = 1;

    const push = (
        kind: TokenKind,
        value: string,
        start: number,
        end: number,
        tokenLine: number,
        tokenColumn: number
    ): void => {
        tokens.push({
            kind,
            value,
            location: {
                line: tokenLine,
                column: tokenColumn,
                offset: start,
                length: end - start,
            },
        });
    };

    const advancePosition = (from: number, to: number): void => {
        for (let cursor = from; cursor < to; cursor++) {
            const code = source.charCodeAt(cursor);
            if (code === CharCode.LineFeed) {
                line++;
                column = 1;
            } else if (code !== CharCode.CarriageReturn) {
                column++;
            }
        }
    };

    while (index < length) {
        const code = source.charCodeAt(index);
        if (lexerCharsetTable[code] & Char.Whitespace) {
            index++;
            if (code === CharCode.LineFeed) {
                line++;
                column = 1;
            } else if (code !== CharCode.CarriageReturn) {
                column++;
            }
            continue;
        }

        const start = index;
        const tokenLine = line;
        const tokenColumn = column;

        // COMMENTS (';' to end of line)
        if (code === CharCode.Semicolon) {
            index++;
            const commentStart = index;
            while (index < length) {
                const commentCode = source.charCodeAt(index);
                if (commentCode === CharCode.LineFeed || commentCode === CharCode.CarriageReturn) {
                    break;
                }
                index++;
            }
            if (
                index < length &&
                source.charCodeAt(index) === CharCode.CarriageReturn &&
                source.charCodeAt(index + 1) === CharCode.LineFeed
            ) {
                index++;
            }
            push(
                TokenKind.Comment,
                source.slice(commentStart, index),
                start,
                index,
                tokenLine,
                tokenColumn
            );
            advancePosition(start, index);
            continue;
        }

        // QUOTED STRINGS (")
        if (code === CharCode.Quote) {
            index++;
            let rawStart = index;
            let escaped = false;
            while (index < length) {
                const stringCode = source.charCodeAt(index);
                if (escaped) {
                    escaped = false;
                    index++;
                    continue;
                }
                if (stringCode === CharCode.Backslash) {
                    escaped = true;
                    index++;
                    continue;
                }
                if (stringCode === CharCode.Quote) {
                    break;
                }
                index++;
            }

            const raw = source.slice(rawStart, index);
            const kind = index < length ? TokenKind.QuotedString : TokenKind.None;
            const end = index < length ? index + 1 : index;
            push(
                kind,
                kind === TokenKind.QuotedString ? unescapeQuotedString(raw) : raw,
                start,
                end,
                tokenLine,
                tokenColumn
            );
            if (index < length) {
                index++;
            }
            advancePosition(start, index);
            continue;
        }

        // MEMBER VARIABLE SEPARATOR (.)
        if (code === CharCode.Dot) {
            index++;
            push(
                TokenKind.MemberVariableSeparator,
                ".",
                start,
                index,
                tokenLine,
                tokenColumn
            );
            advancePosition(start, index);
            continue;
        }

        // IDENTIFIERS (letters, digits, and underscores)
        let identifier = (lexerCharsetTable[code] & Char.IdentStart) !== 0;
        index++;
        while (index < length) {
            const nextCode = source.charCodeAt(index);
            if ((lexerCharsetTable[nextCode] & Char.Whitespace) !== 0 || nextCode === CharCode.Quote) {
                break;
            }
            if (identifier && nextCode === CharCode.Dot) {
                break;
            }
            if (identifier && (lexerCharsetTable[nextCode] & Char.Ident) === 0) {
                identifier = false;
            }
            index++;
        }

        const text = source.slice(start, index);

        const kind = identifier
            ? TokenKind.Identifier
            // NUMERIC LITERALS (integers and floating-point numbers)
            : classifyNumeric(text);
        push(kind, text, start, index, tokenLine, tokenColumn);
        advancePosition(start, index);
    }

    return tokens;
};
