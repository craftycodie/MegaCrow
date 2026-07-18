import { SyntaxKind } from "../../abstract-syntax-tree/kinds";
import { ASTParameterNode } from "../../abstract-syntax-tree/parameters";
import { diagnosticMessages } from "../../diagnostics/messages";
import { LowerError } from "../error";

type ASTParameterNodeOfKind<K extends SyntaxKind> = Extract<
    ASTParameterNode,
    { kind: K }
>;

function assertSyntaxKind<K extends SyntaxKind>(
    parameter: ASTParameterNode,
    kind: K
): asserts parameter is ASTParameterNodeOfKind<K>;
function assertSyntaxKind<K extends SyntaxKind>(
    parameter: ASTParameterNode,
    kinds: readonly K[]
): asserts parameter is ASTParameterNodeOfKind<K>;
function assertSyntaxKind(
    parameter: ASTParameterNode,
    kinds: SyntaxKind | readonly SyntaxKind[]
): asserts parameter is ASTParameterNode {
    const allowed = Array.isArray(kinds) ? kinds : [kinds];
    if (allowed.includes(parameter.kind)) {
        return;
    }
    // TODO: make a proper error message
    throw new LowerError(
        diagnosticMessages.expectedOneOf(
            allowed.map((k) => String(k)),
            String(parameter.kind)
        ),
        parameter.location
    );
}

export { assertSyntaxKind };