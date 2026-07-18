import { ASTParameterNode } from "../../abstract-syntax-tree/parameters";
import { diagnosticMessages } from "../../diagnostics/messages";
import { FrontendError } from "../../error";

export const expectParameterCount = (
        count: number,
        parameters: ASTParameterNode[]
    ) => {
        if (parameters.length !== count) {
            // TODO: finalize copy
        throw new FrontendError(
            diagnosticMessages.invalidParameterCount(count, parameters.length),
            parameters[0].location
        );
    }
};