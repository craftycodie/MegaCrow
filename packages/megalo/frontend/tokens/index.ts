import type { MegaloVersion } from "../../version";
import { Diagnostics, SourceLocation } from "../diagnostics";

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

export class Lexer {
    private megaloVersion: MegaloVersion;

    public constructor(megaloVersion: MegaloVersion) {
        this.megaloVersion = megaloVersion;
    }

    private classifyNumeric = (text: string): TokenKind.Integer | TokenKind.FloatingPoint | TokenKind.None => {
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
    private unescapeQuotedString = (raw: string): string => {
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

    public lex = (source: string, diagnostics: Diagnostics): Tokens => {
        const tokens: Tokens = [];
        const length = source.length;
        let index = 0;
        let line = 1;
        let column = 1;

        let tokenStart = 0;
        let tokenLine = 1;
        let tokenColumn = 1;
        let tokenEnd = 0;

        const advance = (code: number): void => {
            if (code === CharCode.LineFeed) {
                line++;
                column = 1;
            } else if (code !== CharCode.CarriageReturn) {
                column++;
            }
        };

        const advanceSpan = (fromOffset: number, toOffset: number): void => {
            for (let cursor = fromOffset; cursor < toOffset; cursor++) {
                if (source.charCodeAt(cursor) !== CharCode.CarriageReturn) {
                    column++;
                }
            }
        };

        const push = (kind: TokenKind, value: string): void => {
            let endColumn = tokenColumn;
            for (let cursor = tokenStart; cursor < tokenEnd; cursor++) {
                if (source.charCodeAt(cursor) !== CharCode.CarriageReturn) {
                    endColumn++;
                }
            }

            tokens.push({
                kind,
                value,
                location: {
                    start: { offset: tokenStart, line: tokenLine, column: tokenColumn },
                    end: { offset: tokenEnd, line: tokenLine, column: endColumn },
                },
            });
        };

        while (index < length) {
            const code = source.charCodeAt(index);
            if (lexerCharsetTable[code] & Char.Whitespace) {
                index++;
                advance(code);
                continue;
            }

            tokenStart = index;
            tokenLine = line;
            tokenColumn = column;

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
                tokenEnd = index;
                push(TokenKind.Comment, source.slice(commentStart, index));
                advanceSpan(tokenStart, index);
                continue;
            }

            // QUOTED STRINGS (")
            if (code === CharCode.Quote) {
                index++;
                const rawStart = index;
                let escaped = false;
                while (index < length) {
                    const stringCode = source.charCodeAt(index);
                    if (stringCode === CharCode.LineFeed || stringCode === CharCode.CarriageReturn) {
                        break;
                    }
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
                const closed = index < length && source.charCodeAt(index) === CharCode.Quote;
                const kind = closed ? TokenKind.QuotedString : TokenKind.None;
                tokenEnd = closed ? index + 1 : index;
                push(kind, closed ? this.unescapeQuotedString(raw) : raw);
                if (closed) {
                    index++;
                }
                advanceSpan(tokenStart, index);
                continue;
            }

            // MEMBER VARIABLE SEPARATOR (.)
            if (code === CharCode.Dot) {
                index++;
                tokenEnd = index;
                push(TokenKind.MemberVariableSeparator, ".");
                advanceSpan(tokenStart, index);
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

            const text = source.slice(tokenStart, index);
            const kind = identifier
                ? TokenKind.Identifier
                : this.classifyNumeric(text);
            tokenEnd = index;
            push(kind, text);
            advanceSpan(tokenStart, index);
        }

        return tokens;
    };
}