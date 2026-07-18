import type { Token } from "../../../tokens";
import type { ParserContext } from "../../context";
import { parseUserDefinedOption } from "./option";
import type { GameOptionModifiers, UserDefinedOptionNode } from "./types";

export const rangedOptionParser = (
  ctx: ParserContext,
  keywordToken: Token,
  modifiers: GameOptionModifiers
): UserDefinedOptionNode =>
  parseUserDefinedOption(ctx, keywordToken, modifiers, true);
