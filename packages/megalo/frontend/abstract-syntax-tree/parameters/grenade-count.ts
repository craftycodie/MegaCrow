import { ASTParameterNode, ParameterParser } from ".";
import { SourceCodeLocation } from "../../diagnostics";
import { TokenKind } from "../../tokens";
import { ParserContext } from "../context";
import { SyntaxKind } from "../kinds";

export const grenadeCountParser: ParameterParser = (ctx: ParserContext, anchor: SourceCodeLocation) => {
    const countToken = ctx.getToken();
    const parameters: ASTParameterNode[] = [];

    if (countToken.kind === TokenKind.Integer) {
        // "2 frag" is a grenade-count preset (enum-like), not a numeric parameter + type.
        parameters.push({
            kind: SyntaxKind.KEYWORD,
            value: countToken.value,
            location: countToken.location,
        });

        const grenadeTypeToken = ctx.getToken();
        if (grenadeTypeToken.kind === TokenKind.Identifier) {
            parameters.push({
                kind: SyntaxKind.KEYWORD,
                value: grenadeTypeToken.value,
                location: grenadeTypeToken.location,
            });
        }
    }
    else if (countToken.kind === TokenKind.Identifier) {
        parameters.push({
            kind: SyntaxKind.KEYWORD,
            value: countToken.value,
            location: countToken.location,
        });
    }

    return parameters;
};