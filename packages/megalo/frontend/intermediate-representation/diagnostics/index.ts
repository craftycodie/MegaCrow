import { Diagnostics } from "../../diagnostics";
import { LowerError } from "../error";

export const dxAssertionScope = (diagnostics: Diagnostics, func: () => void) => {
    try {
        func();
    } catch (error) {
        if (error instanceof LowerError) {
            diagnostics.addError(error.message, error.location);
        } else {
            throw error;
        }
    }
};