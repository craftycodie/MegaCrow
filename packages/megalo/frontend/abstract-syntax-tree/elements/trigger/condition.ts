import type { MegaloVersion } from "../../../../version";
import {
  type SourceCodeLocation,
  SourceLocationType,
} from "../../../diagnostics";
import { diagnosticMessages } from "../../../diagnostics/messages";
import {
  DISPOSITION_KEYWORDS,
  KILLER_TYPE_KEYWORDS,
} from "../../../language-configuration/omni/conditions";
import { ObjectListType } from "../../../object-lists";
import { type Token, TokenKind } from "../../../tokens";
import type { ParserContext } from "../../context";
import { type ASTNode, SyntaxKind } from "../../kinds";
import {
  KeywordParameter,
  ObjectListParameter,
  type ParameterParser,
  type ParameterSignature,
  ParameterType,
  parameterParserBuilder,
} from "../../parameters";
import {
  type ASTConditionOperandNode,
  type ConditionOperandParser,
  isComparisonToken,
  parseIfOperand,
} from "./operand";

export type ConditionStatementNode = ASTNode<SyntaxKind.CONDITION> & {
  negated: boolean;
  unionOr: boolean;
  name: { value: string; location: SourceCodeLocation };
  operands: ASTConditionOperandNode[];
};

const locationSpan = (
  start: SourceCodeLocation,
  end: SourceCodeLocation
): SourceCodeLocation => ({
  type: SourceLocationType.SOURCE_CODE,
  start: start.start,
  end: end.end,
});

const parseConditionName = (
  ctx: ParserContext,
  anchor: Token
): ConditionStatementNode["name"] | undefined => {
  const token = ctx.peekToken();
  if (token?.kind !== TokenKind.Identifier) {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedTokenKind(
        TokenKind.Identifier,
        token?.kind ?? TokenKind.None,
        token?.value ?? ""
      ),
      token?.location ?? anchor.location
    );
    return;
  }

  const nameToken = ctx.getToken();
  return {
    value: nameToken.value,
    location: nameToken.location,
  };
};

const consumeTrailingOr = (ctx: ParserContext): boolean => {
  const token = ctx.peekToken();
  if (token?.kind === TokenKind.Identifier && token.value === "or") {
    ctx.getToken();
    return true;
  }

  return false;
};

export const parseCondition = (
  ctx: ParserContext,
  conditionToken: Token
): ConditionStatementNode => {
  let negated = false;

  const maybeNot = ctx.peekToken();
  if (maybeNot?.kind === TokenKind.Identifier && maybeNot.value === "not") {
    ctx.getToken();
    negated = true;
  }

  const name = parseConditionName(ctx, conditionToken);
  if (name === undefined) {
    return {
      kind: SyntaxKind.CONDITION,
      negated,
      unionOr: false,
      name: {
        value: "",
        location: conditionToken.location,
      },
      operands: [],
      location: conditionToken.location,
    };
  }

  const parser = ctx.conditionParserRepository.getParser(name.value);
  const operands = parser
    ? parser(ctx, name.location)
    : (ctx.diagnostics.addError(
        diagnosticMessages.unknownCondition(name.value),
        name.location
      ),
      []);

  const unionOr = consumeTrailingOr(ctx);

  const lastOperand = operands.at(-1);
  const endLocation =
    lastOperand !== undefined && lastOperand.kind !== SyntaxKind.INVALID
      ? lastOperand.location
      : name.location;

  return {
    kind: SyntaxKind.CONDITION,
    negated,
    unionOr,
    name,
    operands,
    location: locationSpan(conditionToken.location, endLocation),
  };
};

const parseIfConditionOperands = (
  ctx: ParserContext,
  anchor: SourceCodeLocation
): ASTConditionOperandNode[] => {
  const left = parseIfOperand(ctx, anchor);

  const comparisonToken = ctx.peekToken();
  if (
    comparisonToken === undefined ||
    !isComparisonToken(comparisonToken.kind, comparisonToken.value)
  ) {
    ctx.diagnostics.addError(
      diagnosticMessages.expectedParameterType(
        "comparison operator",
        comparisonToken?.value ?? ""
      ),
      comparisonToken?.location ?? anchor
    );
    return [left];
  }

  const consumedComparison = ctx.getToken();
  const comparison: ASTConditionOperandNode = {
    kind: SyntaxKind.KEYWORD,
    value: consumedComparison.value,
    location: consumedComparison.location,
  };

  const right = parseIfOperand(ctx, anchor);
  return [left, comparison, right];
};

const asConditionParser =
  (parser: ParameterParser): ConditionOperandParser =>
  (ctx, anchor) =>
    parser(ctx, anchor);

const keywordUnion = (...values: readonly string[]) =>
  values.map((value) => KeywordParameter(value));

export class ConditionParserRepository {
  private readonly parsers = new Map<string, ConditionOperandParser>();

  private registerParser(name: string, parser: ConditionOperandParser) {
    this.parsers.set(name, parser);
  }

  private registerSignature(name: string, ...signatures: ParameterSignature[]) {
    this.registerParser(
      name,
      asConditionParser(parameterParserBuilder(...signatures))
    );
  }

  private registerParsers(_megaloVersion: MegaloVersion) {
    this.registerParser("if", parseIfConditionOperands);

    this.registerSignature("object_in_area", [
      ParameterType.Object,
      ParameterType.Object,
    ]);

    this.registerSignature("player_died", [
      ParameterType.Player,
      keywordUnion(...KILLER_TYPE_KEYWORDS),
    ]);

    this.registerSignature("team_disposition", [
      ParameterType.Team,
      keywordUnion(...DISPOSITION_KEYWORDS),
      ParameterType.Team,
    ]);

    this.registerSignature("timer_expired", [ParameterType.Timer]);

    this.registerSignature("object_is_type", [
      ParameterType.Object,
      [
        ObjectListParameter(ObjectListType.Objects),
        ParameterType.QuotedString,
        ParameterType.Number,
        ParameterType.Keyword,
      ],
    ]);

    this.registerSignature("team_is_active", [ParameterType.Team]);
    this.registerSignature("object_out_of_bounds", [ParameterType.Object]);
    this.registerSignature("player_is_fire_team_leader", [
      ParameterType.Player,
    ]);
    this.registerSignature("player_assisted_with_kill", [
      ParameterType.Player,
      ParameterType.Player,
    ]);
    this.registerSignature("object_matches_filter", [
      ParameterType.Object,
      ParameterType.Keyword,
    ]);
    this.registerSignature("player_is_active", [ParameterType.Player]);
    this.registerSignature("equipment_is_active", [ParameterType.Object]);
    this.registerSignature("player_is_spartan", [ParameterType.Player]);
    this.registerSignature("player_is_elite", [ParameterType.Player]);
    this.registerSignature("player_is_editor", [ParameterType.Player]);
    this.registerParser("game_is_forge", () => []);
  }

  public constructor(megaloVersion: MegaloVersion) {
    this.registerParsers(megaloVersion);
  }

  public getParser(name: string): ConditionOperandParser | undefined {
    return this.parsers.get(name);
  }
}
