import { Token } from "../../../tokens";
import { ParserContext } from "../../context";
import { type GameOptionModifiers, type UserDefinedOptionNode } from "./types";
import { parseUserDefinedOption } from "./option";

export const rangedOptionParser = (
    ctx: ParserContext,
    keywordToken: Token,
    modifiers: GameOptionModifiers,
): UserDefinedOptionNode => parseUserDefinedOption(ctx, keywordToken, modifiers, true);
