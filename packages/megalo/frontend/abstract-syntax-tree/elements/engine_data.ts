import { ASTElementBase, ElementKind } from ".";
import { MegaloVersion } from "../../../version";
import { diagnosticMessages } from "../../diagnostics/messages";
import { Token, TokenKind } from "../../tokens";
import { ParserContext } from "../context";
import { isEndToken, locationSpan, parseIdentifier } from "./game_options/shared";
import { isAstErrorNode, SyntaxKind } from "../kinds";
import {
    ASTParameterNode,
    ParameterParser,
    ParameterType,
    parameterParserBuilder as buildParameterParser,
} from "../parameters";

export type EngineDataPropertyNode = {
    identifier: string;
    parameters: ASTParameterNode[];
};

export type EngineDataElementNode = ASTElementBase<ElementKind.ENGINE_DATA> & {
    properties: EngineDataPropertyNode[];
};

export class EngineDataParserRepository {
    private readonly parsers = new Map<string, ParameterParser>();

    private registerParser(name: string, parser: ParameterParser) {
        this.parsers.set(name, parser);
    }

    private registerParsers(_megaloVersion: MegaloVersion) {
        this.registerParser("name", buildParameterParser([ParameterType.String]));
        this.registerParser("description", buildParameterParser([ParameterType.String]));
        this.registerParser("icon", buildParameterParser([ParameterType.Number]));
        this.registerParser("category", buildParameterParser([ParameterType.Keyword]));
    }

    public constructor(megaloVersion: MegaloVersion) {
        this.registerParsers(megaloVersion);
    }

    public getParser(name: string): ParameterParser | undefined {
        return this.parsers.get(name);
    }
}

export const engineDataParser = (
    ctx: ParserContext,
    elementToken: Token,
): EngineDataElementNode => {
    const properties: EngineDataPropertyNode[] = [];

    while (ctx.hasMore()) {
        const token = ctx.peekToken();
        if (!token) {
            break;
        }

        if (isEndToken(token)) {
            const endToken = ctx.getToken();
            return {
                kind: SyntaxKind.ELEMENT,
                elementKind: ElementKind.ENGINE_DATA,
                keywordLocation: elementToken.location,
                properties,
                location: locationSpan(elementToken.location, endToken.location),
            };
        }

        const propertyIdentifier = parseIdentifier(ctx, elementToken);

        if (isAstErrorNode(propertyIdentifier)) {
            continue;
        }

        const parser = ctx.engineDataParserRepository.getParser(propertyIdentifier.value);
        if (parser) {
            properties.push({
                identifier: propertyIdentifier.value,
                parameters: parser(ctx, propertyIdentifier.location),
            });
        } else {
            ctx.diagnostics.addError(
                diagnosticMessages.unknownEngineDataProperty(propertyIdentifier.value),
                propertyIdentifier.location,
            );
        }
    }

    ctx.diagnostics.addError(diagnosticMessages.expectedEndBeforeEof(), elementToken.location);
    return {
        kind: SyntaxKind.ELEMENT,
        elementKind: ElementKind.ENGINE_DATA,
        keywordLocation: elementToken.location,
        properties,
        location: elementToken.location,
    };
};
