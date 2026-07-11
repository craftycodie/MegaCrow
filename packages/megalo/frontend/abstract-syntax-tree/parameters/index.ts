import { ASTErrorNode, ASTIntegerNode, ASTMemberReferenceNode, ASTNode, ASTReferenceNode, SyntaxKind } from "../kinds";
import { SourceCodeLocation, SourceLocationType } from "../../diagnostics";
import { diagnosticMessages } from "../../diagnostics/messages";
import { SymbolKind, SymbolTableEntry, SymbolId, VariableType } from "../../symbol-table";
import { TokenKind } from "../../tokens";
import { ParserContext } from "../context";

export const enum ParameterType {
    Keyword,
    Number,
    String,
    Timer,
    Team,
    Player,
    Object,
    HudWidget,
    Loadout,
    LoadoutPalette,
    RequisitionPalette,
    MathOperation,
}

export type KeywordParameter = {
    readonly kind: "keyword";
    readonly value: string;
};

export const KeywordParameter = (value: string): KeywordParameter => ({
    kind: "keyword",
    value,
});

export type ParameterSpec = ParameterType | KeywordParameter;

export type OptionalParameterSpec = {
    readonly kind: "optional";
    readonly name: string;
    readonly specs?: readonly ParameterSpec[];
};

export const OptionalParameter = (
    name: string,
    ...specs: ParameterSpec[]
): OptionalParameterSpec => ({
    kind: "optional",
    name,
    specs: specs.length > 0 ? specs : undefined,
});

export type ParameterSlot = ParameterSpec | readonly ParameterSpec[] | OptionalParameterSpec;

export type ParameterSignature = readonly ParameterSlot[];

export type ASTKeywordParameterNode = ASTNode<SyntaxKind.KEYWORD> & {
    value: string;
};

export type ASTParameterNode =
    | ASTKeywordParameterNode
    | ASTIntegerNode
    | ASTReferenceNode
    | ASTMemberReferenceNode
    | ASTErrorNode;

export type ParameterParser = (ctx: ParserContext, anchor: SourceCodeLocation) => ASTParameterNode[];

const isKeywordParameter = (spec: ParameterSpec): spec is KeywordParameter =>
    typeof spec === "object" && spec.kind === "keyword";

const isOptionalParameter = (slot: ParameterSlot): slot is OptionalParameterSpec =>
    typeof slot === "object" && !Array.isArray(slot) && "kind" in slot && slot.kind === "optional";

const isParameterUnion = (slot: ParameterSlot): slot is readonly ParameterSpec[] =>
    Array.isArray(slot);

const matchesParameterType = (entry: SymbolTableEntry, type: ParameterType): boolean => {
    switch (type) {
        case ParameterType.Number:
            return entry.kind === SymbolKind.Constant
                || entry.kind === SymbolKind.GameOption
                || (entry.kind === SymbolKind.Variable && entry.type === VariableType.Number);
        case ParameterType.Timer:
            return entry.kind === SymbolKind.Variable && entry.type === VariableType.Timer;
        case ParameterType.Team:
            return entry.kind === SymbolKind.Variable && entry.type === VariableType.Team;
        case ParameterType.Player:
            return entry.kind === SymbolKind.Variable && entry.type === VariableType.Player;
        case ParameterType.Object:
            return entry.kind === SymbolKind.Variable && entry.type === VariableType.Object;
        case ParameterType.HudWidget:
            return entry.kind === SymbolKind.HudWidget;
        case ParameterType.Loadout:
            return entry.kind === SymbolKind.Loadout;
        case ParameterType.LoadoutPalette:
            return entry.kind === SymbolKind.LoadoutPalette;
        case ParameterType.RequisitionPalette:
            return entry.kind === SymbolKind.RequisitionPalette;
        case ParameterType.String:
            return entry.kind === SymbolKind.String;
        default:
            return false;
    }
};

const isVariableParameterType = (type: ParameterType): boolean =>
    type === ParameterType.Number
    || type === ParameterType.Timer
    || type === ParameterType.Team
    || type === ParameterType.Player
    || type === ParameterType.Object;

const locationSpan = (start: SourceCodeLocation, end: SourceCodeLocation): SourceCodeLocation => ({
    type: SourceLocationType.SOURCE_CODE,
    start: start.start,
    end: end.end,
});

/** Parse a single `.member` after a root identifier that has already been consumed. */
export const parseMemberReference = (
    ctx: ParserContext,
    rootToken: { value: string; location: SourceCodeLocation },
    rootSymbolId?: SymbolId,
): ASTMemberReferenceNode => {
    ctx.getToken(); // MemberVariableSeparator
    const memberToken = ctx.getToken();
    if (memberToken.kind !== TokenKind.Identifier) {
        ctx.diagnostics.addError(
            diagnosticMessages.expectedTokenKind(TokenKind.Identifier, memberToken.kind, memberToken.value),
            memberToken.location,
        );
        return {
            kind: SyntaxKind.MEMBER_REFERENCE,
            root: rootToken.value,
            rootSymbolId,
            member: { value: "", location: memberToken.location },
            location: locationSpan(rootToken.location, memberToken.location),
        };
    }

    return {
        kind: SyntaxKind.MEMBER_REFERENCE,
        root: rootToken.value,
        rootSymbolId,
        member: {
            value: memberToken.value,
            location: memberToken.location,
        },
        location: locationSpan(rootToken.location, memberToken.location),
    };
};

const lookupReferenceSymbolId = (ctx: ParserContext, name: string): SymbolId | undefined =>
    ctx.symbolParser.lookupSymbol(name)
    ?? ctx.symbolParser.lookupString(name)
    ?? ctx.symbolParser.lookupHudWidget(name)
    ?? ctx.symbolParser.lookupLoadout(name)
    ?? ctx.symbolParser.lookupLoadoutPalette(name)
    ?? ctx.symbolParser.lookupRequisitionPalette(name);

const consumeLenientParameter = (
    ctx: ParserContext,
    anchor: SourceCodeLocation,
): ASTParameterNode => {
    const token = ctx.peekToken();

    if (
        token?.kind === TokenKind.Identifier
        && ctx.peekToken(1)?.kind === TokenKind.MemberVariableSeparator
    ) {
        const rootToken = ctx.getToken();
        return parseMemberReference(
            ctx,
            rootToken,
            ctx.symbolParser.lookupSymbol(rootToken.value),
        );
    }

    const consumed = ctx.getToken();

    if (consumed.kind === TokenKind.Integer) {
        return {
            kind: SyntaxKind.INTEGER,
            value: Number.parseInt(consumed.value, 10),
            location: consumed.location,
        };
    }

    if (consumed.kind === TokenKind.Operator || consumed.kind === TokenKind.Identifier) {
        const symbolId = consumed.kind === TokenKind.Identifier
            ? lookupReferenceSymbolId(ctx, consumed.value)
            : undefined;

        if (symbolId !== undefined) {
            return {
                kind: SyntaxKind.REFERENCE,
                identifier: consumed.value,
                symbolId,
                location: consumed.location,
            };
        }

        return {
            kind: SyntaxKind.KEYWORD,
            value: consumed.value,
            location: consumed.location,
        };
    }

    return {
        kind: SyntaxKind.INVALID,
        location: consumed.location ?? anchor,
    };
};

const parseVariableParameter = (
    ctx: ParserContext,
    type: ParameterType,
): ASTParameterNode | undefined => {
    const token = ctx.peekToken();

    if (type === ParameterType.Number && token?.kind === TokenKind.Integer) {
        const integerToken = ctx.getToken();
        return {
            kind: SyntaxKind.INTEGER,
            value: Number.parseInt(integerToken.value, 10),
            location: integerToken.location,
        };
    }

    if (token?.kind !== TokenKind.Identifier) {
        return undefined;
    }

    if (ctx.peekToken(1)?.kind === TokenKind.MemberVariableSeparator) {
        const rootToken = ctx.getToken();
        return parseMemberReference(
            ctx,
            rootToken,
            ctx.symbolParser.lookupSymbol(rootToken.value),
        );
    }

    const symbolId = ctx.symbolParser.lookupSymbol(token.value);
    if (symbolId === undefined) {
        return undefined;
    }

    const entry = ctx.symbolParser.getSymbolEntry(symbolId);
    if (entry === undefined || !matchesParameterType(entry, type)) {
        return undefined;
    }

    const referenceToken = ctx.getToken();
    return {
        kind: SyntaxKind.REFERENCE,
        identifier: referenceToken.value,
        symbolId,
        location: referenceToken.location,
    };
};

const parseParameter = (
    ctx: ParserContext,
    spec: ParameterSpec,
): ASTParameterNode | undefined => {
    const token = ctx.peekToken();

    if (isKeywordParameter(spec)) {
        if (token?.kind !== TokenKind.Identifier || token.value !== spec.value) {
            return undefined;
        }

        const keywordToken = ctx.getToken();
        return {
            kind: SyntaxKind.KEYWORD,
            value: keywordToken.value,
            location: keywordToken.location,
        };
    }

    if (isVariableParameterType(spec)) {
        return parseVariableParameter(ctx, spec);
    }

    switch (spec) {
        case ParameterType.Keyword: {
            if (token?.kind !== TokenKind.Identifier) {
                return undefined;
            }

            const keywordToken = ctx.getToken();
            return {
                kind: SyntaxKind.KEYWORD,
                value: keywordToken.value,
                location: keywordToken.location,
            };
        }

        case ParameterType.MathOperation: {
            if (token?.kind !== TokenKind.Operator && token?.kind !== TokenKind.Identifier) {
                return undefined;
            }

            const mathToken = ctx.getToken();
            return {
                kind: SyntaxKind.KEYWORD,
                value: mathToken.value,
                location: mathToken.location,
            };
        }

        case ParameterType.HudWidget: {
            if (token?.kind !== TokenKind.Identifier) {
                return undefined;
            }

            const symbolId = ctx.symbolParser.lookupHudWidget(token.value);
            if (symbolId === undefined) {
                return undefined;
            }

            const referenceToken = ctx.getToken();
            return {
                kind: SyntaxKind.REFERENCE,
                identifier: referenceToken.value,
                symbolId,
                location: referenceToken.location,
            };
        }

        case ParameterType.Loadout: {
            if (token?.kind !== TokenKind.Identifier) {
                return undefined;
            }

            const symbolId = ctx.symbolParser.lookupLoadout(token.value);
            if (symbolId === undefined) {
                return undefined;
            }

            const referenceToken = ctx.getToken();
            return {
                kind: SyntaxKind.REFERENCE,
                identifier: referenceToken.value,
                symbolId,
                location: referenceToken.location,
            };
        }

        case ParameterType.LoadoutPalette: {
            if (token?.kind !== TokenKind.Identifier) {
                return undefined;
            }

            const symbolId = ctx.symbolParser.lookupLoadoutPalette(token.value);
            if (symbolId === undefined) {
                return undefined;
            }

            const referenceToken = ctx.getToken();
            return {
                kind: SyntaxKind.REFERENCE,
                identifier: referenceToken.value,
                symbolId,
                location: referenceToken.location,
            };
        }

        case ParameterType.RequisitionPalette: {
            if (token?.kind !== TokenKind.Identifier) {
                return undefined;
            }

            const symbolId = ctx.symbolParser.lookupRequisitionPalette(token.value);
            if (symbolId === undefined) {
                return undefined;
            }

            const referenceToken = ctx.getToken();
            return {
                kind: SyntaxKind.REFERENCE,
                identifier: referenceToken.value,
                symbolId,
                location: referenceToken.location,
            };
        }

        case ParameterType.String: {
            if (token?.kind !== TokenKind.Identifier) {
                return undefined;
            }

            const symbolId = ctx.symbolParser.lookupString(token.value);
            if (symbolId === undefined) {
                return undefined;
            }

            const referenceToken = ctx.getToken();
            return {
                kind: SyntaxKind.REFERENCE,
                identifier: referenceToken.value,
                symbolId,
                location: referenceToken.location,
            };
        }

        default:
            return undefined;
    }
};

const tryParseSlot = (
    ctx: ParserContext,
    slot: ParameterSlot,
): ASTParameterNode[] | undefined => {
    if (isOptionalParameter(slot)) {
        const token = ctx.peekToken();
        if (token?.kind !== TokenKind.Identifier || token.value !== slot.name) {
            return [];
        }

        const nameToken = ctx.getToken();
        const nodes: ASTParameterNode[] = [{
            kind: SyntaxKind.KEYWORD,
            value: nameToken.value,
            location: nameToken.location,
        }];

        if (slot.specs !== undefined) {
            for (const spec of slot.specs) {
                const parameter = parseParameter(ctx, spec);
                if (parameter === undefined) {
                    return undefined;
                }

                nodes.push(parameter);
            }
        }

        return nodes;
    }

    if (isParameterUnion(slot)) {
        for (const spec of slot) {
            const mark = ctx.mark();
            const parameter = parseParameter(ctx, spec);
            if (parameter !== undefined) {
                return [parameter];
            }

            ctx.reset(mark);
        }

        return undefined;
    }

    const parameter = parseParameter(ctx, slot);
    return parameter === undefined ? undefined : [parameter];
};

const parseSlot = (
    ctx: ParserContext,
    slot: ParameterSlot,
    anchor: SourceCodeLocation,
): ASTParameterNode[] => {
    if (isOptionalParameter(slot)) {
        const token = ctx.peekToken();
        if (token?.kind !== TokenKind.Identifier || token.value !== slot.name) {
            return [];
        }

        const nameToken = ctx.getToken();
        const nodes: ASTParameterNode[] = [{
            kind: SyntaxKind.KEYWORD,
            value: nameToken.value,
            location: nameToken.location,
        }];

        if (slot.specs !== undefined) {
            for (const spec of slot.specs) {
                const parameter = parseParameter(ctx, spec) ?? consumeLenientParameter(ctx, anchor);
                nodes.push(parameter);
            }
        }

        return nodes;
    }

    if (isParameterUnion(slot)) {
        for (const spec of slot) {
            const mark = ctx.mark();
            const parameter = parseParameter(ctx, spec);
            if (parameter !== undefined) {
                return [parameter];
            }

            ctx.reset(mark);
        }

        return [consumeLenientParameter(ctx, anchor)];
    }

    return [parseParameter(ctx, slot) ?? consumeLenientParameter(ctx, anchor)];
};

const tryParseSignature = (
    ctx: ParserContext,
    signature: ParameterSignature,
): ASTParameterNode[] | undefined => {
    const parameters: ASTParameterNode[] = [];

    for (const slot of signature) {
        const parsed = tryParseSlot(ctx, slot);
        if (parsed === undefined) {
            return undefined;
        }

        parameters.push(...parsed);
    }

    return parameters;
};

const parseSignature = (
    ctx: ParserContext,
    signature: ParameterSignature,
    anchor: SourceCodeLocation,
): ASTParameterNode[] => {
    const parameters: ASTParameterNode[] = [];

    for (const slot of signature) {
        parameters.push(...parseSlot(ctx, slot, anchor));
    }

    return parameters;
};

export const parameterParserBuilder = (...signatures: ParameterSignature[]): ParameterParser => {
    if (signatures.length === 0) {
        return () => [];
    }

    return (ctx: ParserContext, anchor: SourceCodeLocation) => {
        const parseAnchor = anchor;

        for (const signature of signatures) {
            const mark = ctx.mark();
            const parameters = tryParseSignature(ctx, signature);
            if (parameters !== undefined) {
                return parameters;
            }

            ctx.reset(mark);
        }

        // Prefer the signature that matched the most leading slots before failing.
        // Falling back to signatures[0] alone mis-parses discriminated forms like
        // play_sound's everyone|player|team targets when a later slot is unresolved.
        let bestSignature = signatures[0]!;
        let bestScore = -1;

        for (const signature of signatures) {
            const mark = ctx.mark();
            let score = 0;

            for (const slot of signature) {
                const parsed = tryParseSlot(ctx, slot);
                if (parsed === undefined) {
                    break;
                }

                score += 1;
            }

            ctx.reset(mark);

            if (score > bestScore) {
                bestScore = score;
                bestSignature = signature;
            }
        }

        return parseSignature(ctx, bestSignature, parseAnchor);
    };
};
