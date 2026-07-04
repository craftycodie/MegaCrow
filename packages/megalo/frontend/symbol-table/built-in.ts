import { SymbolBinder } from ".";
import { MegaloVersion } from "../../version";
import { BUILT_IN_LOCATION, SourceLocationType } from "../diagnostics";
import { ParserSymbolContext } from "./parser";

export const addBuiltInConstants = (megaloVersion: MegaloVersion, symbolParser: ParserSymbolContext): void => {
    symbolParser.addConstantToScope({
        name: "true",
        declaration: BUILT_IN_LOCATION,
    });
    symbolParser.addConstantToScope({
        name: "false",
        declaration: BUILT_IN_LOCATION,
    });
};