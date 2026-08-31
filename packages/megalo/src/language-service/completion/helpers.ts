import { OPEN_ENDED_POSITION } from "src/diagnostics";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree/kinds";
import {
  matchesParameterType,
  ParameterType,
} from "src/frontend/abstract-syntax-tree/parameters";
import {
  isWritableCustomVariable,
  isWritableExplicitObject,
  isWritableExplicitPlayer,
  isWritableExplicitTeam,
} from "src/frontend/intermediate-representation/diagnostics/isWritable";
import {
  playerFilterType,
  teamOrPlayerTarget,
} from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_actions";
import type { CustomVariableReference } from "src/frontend/intermediate-representation/game/megalogamengine/megalogamengine_references";
import type { MegaloEnumDef } from "src/frontend/intermediate-representation/megaloEnum";
import {
  tryParseExplicitObject,
  tryParseExplicitPlayer,
  tryParseExplicitTeam,
} from "src/frontend/intermediate-representation/parameters/explicit";
import { GAME_OPTION_CUSTOM_VARIABLE_TYPE } from "src/frontend/intermediate-representation/parameters/gameOptionTypes";
import { ObjectListType } from "src/frontend/object-lists";
import {
  isBuiltInVariable,
  SymbolKind,
  type SymbolTableEntry,
  type SymbolTableVariableEntry,
  VariableScope,
  VariableType,
} from "src/frontend/symbol-table";
import { MEGACROW_VERSION_STRING_NAME } from "src/frontend/symbol-table/built-in";
import type {
  ActionCompletionContext,
  CompletionContextBase,
  CompletionItem,
  CompletionKind,
  ConditionCompletionContext,
} from "src/language-service/completion/types";

type SuggestCtx = CompletionContextBase;

export type { SuggestCtx };

/** Sentinel ends (and starts) mean "open" — visible through EOF / from file start. */
const isOpenEnded = (offset: number): boolean =>
  offset === OPEN_ENDED_POSITION.localOffset;

const isVisibleAt = (entry: SymbolTableEntry, offset: number): boolean => {
  const { start, end } = entry.range;
  const afterStart =
    isOpenEnded(start.localOffset) || offset >= start.localOffset;
  const beforeEnd = isOpenEnded(end.localOffset) || offset < end.localOffset;
  return afterStart && beforeEnd;
};

const variableTypeLabel = (type: VariableType): string => {
  switch (type) {
    case VariableType.Number:
      return "number";
    case VariableType.Timer:
      return "timer";
    case VariableType.Team:
      return "team";
    case VariableType.Player:
      return "player";
    case VariableType.Object:
      return "object";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
};

const parameterTypeLabel = (type: ParameterType): string => {
  switch (type) {
    case ParameterType.Integer:
    case ParameterType.Float:
      return "number";
    case ParameterType.Timer:
      return "timer";
    case ParameterType.Team:
      return "team";
    case ParameterType.Player:
      return "player";
    case ParameterType.Object:
      return "object";
    case ParameterType.String:
    case ParameterType.QuotedString:
    case ParameterType.DynamicString:
      return "string";
    case ParameterType.HudWidget:
      return "hud widget";
    case ParameterType.Loadout:
      return "loadout";
    case ParameterType.LoadoutPalette:
      return "loadout palette";
    case ParameterType.RequisitionPalette:
      return "requisition palette";
    case ParameterType.ObjectFilter:
      return "object filter";
    case ParameterType.PlayerTraits:
      return "player traits";
    case ParameterType.Keyword:
      return "keyword";
    case ParameterType.MathOperation:
      return "math operation";
    default: {
      const _exhaustive: never = type;
      return _exhaustive;
    }
  }
};

/** Human-readable type shown beside completion labels in the IDE. */
export const completionDetailForEntry = (entry: SymbolTableEntry): string => {
  switch (entry.kind) {
    case SymbolKind.Variable:
      return variableTypeLabel(entry.type);
    case SymbolKind.Constant:
      return "constant";
    case SymbolKind.String:
      return "string";
    case SymbolKind.GameOption:
      return "game option";
    case SymbolKind.HudWidget:
      return "hud widget";
    case SymbolKind.Loadout:
      return "loadout";
    case SymbolKind.LoadoutPalette:
      return "loadout palette";
    case SymbolKind.RequisitionPalette:
      return "requisition palette";
    case SymbolKind.ObjectListItem:
      return entry.objectType.replaceAll("_", " ");
    case SymbolKind.ObjectFilter:
      return "object filter";
    case SymbolKind.PlayerTraits:
      return "player traits";
    case SymbolKind.GameStat:
      return "game stat";
    default: {
      const _exhaustive: never = entry;
      return _exhaustive;
    }
  }
};

/** Bare refs: globals/temps (+ constants). Member-scoped names need `root.`. */
const isBareReferenceScope = (scope: VariableScope): boolean =>
  scope === VariableScope.Global || scope === VariableScope.Temporary;

const memberScopeForRootType = (
  rootType: VariableType
): VariableScope | undefined => {
  switch (rootType) {
    case VariableType.Player:
      return VariableScope.Player;
    case VariableType.Team:
      return VariableScope.Team;
    case VariableType.Object:
      return VariableScope.Object;
    default:
      return;
  }
};

/** Built-in `.member` names that are not declared in `variables` blocks. */
const builtinMembersFor = (
  rootType: VariableType,
  type: ParameterType
): string[] => {
  const names: string[] = [];
  const wantsNumber =
    type === ParameterType.Integer || type === ParameterType.Float;
  if (rootType === VariableType.Player) {
    if (wantsNumber) {
      names.push("score", "money", "rating");
    }
    if (type === ParameterType.Team) {
      names.push("team");
    }
  } else if (rootType === VariableType.Team) {
    if (wantsNumber) {
      names.push("score");
    }
  } else if (rootType === VariableType.Object) {
    if (wantsNumber) {
      names.push("user_data");
    }
    if (type === ParameterType.Team) {
      names.push("team");
    }
  }
  return names;
};

const resolveVisibleRootType = (
  ctx: SuggestCtx,
  rootName: string
): VariableType | undefined => {
  for (const entry of ctx.snapshot.ast.symbolTable.toArray()) {
    if (entry.name !== rootName) {
      continue;
    }
    if (!isVisibleAt(entry, ctx.offset)) {
      continue;
    }
    if (entry.kind === SymbolKind.Variable) {
      return entry.type;
    }
  }
  return;
};

/**
 * Lower score = better match. `undefined` means no match.
 * Prefers prefix, then snake_case segment, then substring, then subsequence.
 */
export const fuzzyMatchScore = (
  label: string,
  query: string
): number | undefined => {
  if (query.length === 0) {
    return 0;
  }
  const l = label.toLowerCase();
  const q = query.toLowerCase();

  if (l === q) {
    return 0;
  }
  if (l.startsWith(q)) {
    return 1;
  }

  const segments = l.split("_");
  for (let i = 0; i < segments.length; i++) {
    const seg = segments[i]!;
    if (seg === q) {
      return 10 + i;
    }
    if (seg.startsWith(q)) {
      return 20 + i;
    }
  }

  const substringIndex = l.indexOf(q);
  if (substringIndex >= 0) {
    return 100 + substringIndex;
  }

  // Loose subsequence only for multi-char queries (avoids "s" matching everything).
  if (q.length < 2) {
    return;
  }
  let qi = 0;
  let first = -1;
  let gaps = 0;
  let prev = -1;
  for (let i = 0; i < l.length && qi < q.length; i++) {
    if (l[i] !== q[qi]) {
      continue;
    }
    if (first < 0) {
      first = i;
    }
    if (prev >= 0) {
      gaps += i - prev - 1;
    }
    prev = i;
    qi += 1;
  }
  if (qi === q.length) {
    return 200 + first + gaps;
  }
  return;
};

/** @deprecated Prefer {@link filterByFuzzy}; kept as an alias. */
export const filterByPrefix = (
  items: CompletionItem[],
  prefix: string
): CompletionItem[] => filterByFuzzy(items, prefix);

/**
 * Filter and rank completion items with fuzzy matching.
 * Non-prefix hits set `filterText` to the query so Monaco keeps them visible.
 */
export const filterByFuzzy = (
  items: CompletionItem[],
  prefix: string
): CompletionItem[] => {
  if (prefix.length === 0) {
    return items;
  }

  const scored: { item: CompletionItem; score: number }[] = [];
  for (const entry of items) {
    const score = fuzzyMatchScore(entry.label, prefix);
    if (score === undefined) {
      continue;
    }
    const isPrefixMatch = score <= 1;
    scored.push({
      score,
      item: {
        ...entry,
        sortText: `${String(score).padStart(4, "0")}_${entry.sortText ?? entry.label}`,
        // Monaco re-filters by filterText; pin to the query so fuzzy hits aren't dropped.
        ...(isPrefixMatch || entry.filterText !== undefined
          ? {}
          : { filterText: prefix }),
      },
    });
  }

  scored.sort(
    (a, b) => a.score - b.score || a.item.label.localeCompare(b.item.label)
  );
  return scored.map((entry) => entry.item);
};

/**
 * While replacing an existing token, keep every candidate visible: skip
 * prefix-filtering and set `filterText` to the current prefix so Monaco does
 * not hide siblings of an exact match.
 */
export const forReplacingToken = (
  ctx: SuggestCtx,
  items: CompletionItem[]
): CompletionItem[] => {
  const prefix = ctx.prefix.text;
  if (prefix.length === 0) {
    return items;
  }
  return items.map((item) =>
    item.filterText === undefined ? { ...item, filterText: prefix } : item
  );
};

export interface SuggestOptions {
  /**
   * More operands follow on this statement: append a trailing space and reopen
   * suggest after accept.
   */
  continueCompletion?: boolean;
  /** Include symbols declared later in the file (forward references). */
  ignoreVisibility?: boolean;
  /** Offer all candidates while the cursor is inside/replacing a value token. */
  replacingToken?: boolean;
  /**
   * Only suggest destinations MegaloEdit would accept with `must_be_writeable`
   * (action out-params / `set` LHS).
   */
  writable?: boolean;
}

/** Built-in `.member` names that are not writable custom-variable destinations. */
const NON_WRITABLE_BUILTIN_MEMBERS = new Set([
  "player_rating",
  "rating",
  "user_data",
]);

const isWritableBuiltInNumberName = (name: string): boolean => {
  // Use the non-pregame mapping so `symmetric_gametype` is not offered as a
  // general writable destination (Pregame variant is context-specific).
  const mapped = GAME_OPTION_CUSTOM_VARIABLE_TYPE[name];
  if (mapped === undefined) {
    return false;
  }
  return isWritableCustomVariable({
    type: mapped,
  } as CustomVariableReference);
};

const isWritableVariableForType = (
  entry: SymbolTableVariableEntry,
  type: ParameterType
): boolean => {
  switch (type) {
    case ParameterType.Integer:
    case ParameterType.Float: {
      if (entry.type !== VariableType.Number) {
        return false;
      }
      if (!isBuiltInVariable(entry)) {
        return true;
      }
      return isWritableBuiltInNumberName(entry.name);
    }
    case ParameterType.Timer:
      return entry.type === VariableType.Timer;
    case ParameterType.Player: {
      if (entry.type !== VariableType.Player) {
        return false;
      }
      if (!isBuiltInVariable(entry)) {
        return true;
      }
      const explicit = tryParseExplicitPlayer(entry.name);
      return explicit !== undefined && isWritableExplicitPlayer(explicit);
    }
    case ParameterType.Object: {
      // Writable object outs reject player bipeds (`is_player_reference`).
      if (entry.type === VariableType.Player) {
        return false;
      }
      if (entry.type !== VariableType.Object) {
        return false;
      }
      if (!isBuiltInVariable(entry)) {
        return true;
      }
      const explicit = tryParseExplicitObject(entry.name);
      return explicit !== undefined && isWritableExplicitObject(explicit);
    }
    case ParameterType.Team: {
      if (entry.type !== VariableType.Team) {
        return false;
      }
      if (!isBuiltInVariable(entry)) {
        return true;
      }
      const explicit = tryParseExplicitTeam(entry.name);
      return explicit !== undefined && isWritableExplicitTeam(explicit);
    }
    default:
      return false;
  }
};

const isWritableSuggestionForType = (
  entry: SymbolTableEntry,
  type: ParameterType
): boolean => {
  if (
    entry.kind === SymbolKind.Constant ||
    entry.kind === SymbolKind.GameOption
  ) {
    return false;
  }
  if (entry.kind !== SymbolKind.Variable) {
    return false;
  }
  return isWritableVariableForType(entry, type);
};

const matchesWritableParameterType = (
  entry: SymbolTableEntry,
  types: readonly ParameterType[]
): boolean => {
  for (const type of types) {
    if (
      matchesParameterType(entry, type) &&
      isWritableSuggestionForType(entry, type)
    ) {
      return true;
    }
  }
  return false;
};

const finalizeSuggestions = (
  ctx: SuggestCtx,
  items: CompletionItem[],
  options?: SuggestOptions
): CompletionItem[] => {
  const filtered =
    options?.replacingToken === true
      ? forReplacingToken(ctx, items)
      : filterByPrefix(items, ctx.prefix.text);
  if (options?.continueCompletion === true) {
    return filtered.map(withContinueCompletion);
  }
  return filtered;
};

const item = (
  label: string,
  kind: CompletionKind,
  extras?: Partial<CompletionItem>
): CompletionItem => ({
  label,
  kind,
  sortText: label,
  ...extras,
});

export const suggestKeywords = (
  ctx: SuggestCtx,
  names: readonly string[],
  kind: CompletionKind = "keyword"
): CompletionItem[] => {
  const items = filterByPrefix(
    names.map((name) => item(name, kind)),
    ctx.prefix.text
  );
  // Property keys almost always take a value on the same line.
  if (kind === "property") {
    return items.map((entry) =>
      entry.label === "end" ? entry : withContinueCompletion(entry)
    );
  }
  return items;
};

/**
 * Accepting this item should hop into the blank body of an already-inserted
 * `header / indent / end` block (and reopen suggest there).
 */
export const withEnterBlockBody = (entry: CompletionItem): CompletionItem => ({
  ...entry,
  enterBlockBodyAfterAccept: true,
});

/**
 * Accepting this item leaves more to type on the statement: append a trailing
 * space (unless it is already a multi-line snippet) and reopen suggest.
 */
export const withContinueCompletion = (
  entry: CompletionItem
): CompletionItem => {
  if (entry.insertAsSnippet === true) {
    return { ...entry, triggerSuggestAfterAccept: true };
  }
  const base = entry.insertText ?? entry.label;
  return {
    ...entry,
    insertText: base.endsWith(" ") ? base : `${base} `,
    triggerSuggestAfterAccept: true,
  };
};

/**
 * Expand a block opener so accepting it inserts a body line and matching `end`.
 * Cursor lands on the indented blank line (`$1`, or `$2` when the header already
 * uses tabstop 1). `$0` is Monaco's final tabstop and exits snippet mode
 * immediately, which leaves the cursor on the header.
 *
 * @param headerSuffix optional snippet text after the label (e.g. tabstop(1, "general"))
 */
export const withBlockEndSnippet = (
  entry: CompletionItem,
  headerSuffix = ""
): CompletionItem => {
  const bodyTabstop = headerSuffix === "" ? 1 : 2;
  return {
    ...entry,
    insertText: `${entry.label}${headerSuffix}\n\t$${bodyTabstop}\nend`,
    insertAsSnippet: true,
    triggerSuggestAfterAccept: true,
  };
};

/** Build a snippet tabstop like ` ${1:name}` without tripping curly-in-string lint. */
export const snippetTabstop = (index: number, placeholder = ""): string =>
  placeholder === "" ? ` $${""}{${index}}` : ` $${""}{${index}:${placeholder}}`;

/** True when the next non-empty line after `offset` is a block `end`. */
export const followingLineClosesBlock = (
  source: string,
  offset: number
): boolean => {
  const newline = source.indexOf("\n", offset);
  if (newline === -1) {
    return false;
  }
  for (const line of source.slice(newline + 1).split("\n")) {
    if (line.trim() === "") {
      continue;
    }
    return line.trim() === "end";
  }
  return false;
};

export const suggestEnum = (
  ctx: SuggestCtx,
  def:
    | MegaloEnumDef<string>
    | Pick<MegaloEnumDef<string>, "names" | "isDeprecated" | "supportedMembers">
    | readonly string[]
): CompletionItem[] => {
  let names: readonly string[];
  if (Array.isArray(def)) {
    names = def;
  } else if ("names" in def) {
    // Canonical members only — aliases parse but stay out of autocomplete.
    names = def.names.filter((name) => {
      if ("isDeprecated" in def && def.isDeprecated?.(name)) {
        return false;
      }
      if (
        "supportedMembers" in def &&
        typeof def.supportedMembers === "function"
      ) {
        return def.supportedMembers(ctx.snapshot.version).has(name);
      }
      return true;
    });
  } else {
    names = [];
  }
  return filterByPrefix(
    names.map((name) => item(name, "enumMember")),
    ctx.prefix.text
  );
};

const pushUnique = (
  items: CompletionItem[],
  seen: Set<string>,
  label: string,
  kind: CompletionKind,
  extras?: Partial<CompletionItem>
): void => {
  if (seen.has(label)) {
    return;
  }
  seen.add(label);
  items.push(item(label, kind, extras));
};

const suggestMembers = (
  ctx: SuggestCtx,
  type: ParameterType,
  rootName: string,
  options?: SuggestOptions
): CompletionItem[] => {
  const rootType = resolveVisibleRootType(ctx, rootName);
  if (rootType === undefined) {
    return [];
  }
  const memberScope = memberScopeForRootType(rootType);
  if (memberScope === undefined) {
    return [];
  }

  const items: CompletionItem[] = [];
  const seen = new Set<string>();
  const requireWritable = options?.writable === true;

  for (const name of builtinMembersFor(rootType, type)) {
    if (requireWritable && NON_WRITABLE_BUILTIN_MEMBERS.has(name)) {
      continue;
    }
    pushUnique(items, seen, name, "property", {
      detail: parameterTypeLabel(type),
    });
  }

  for (const entry of ctx.snapshot.ast.symbolTable.toArray()) {
    if (entry.kind !== SymbolKind.Variable) {
      continue;
    }
    if (entry.scope !== memberScope) {
      continue;
    }
    if (!matchesParameterType(entry, type)) {
      continue;
    }
    // Scoped members are always writable at the custom-variable type layer
    // (MegaloEdit does not re-check nested explicits for must_be_writeable).
    pushUnique(items, seen, entry.name, "property", {
      detail: completionDetailForEntry(entry),
    });
  }

  return filterByPrefix(items, ctx.prefix.text);
};

export const suggestTyped = (
  ctx: SuggestCtx,
  type: ParameterType | readonly ParameterType[],
  options?: SuggestOptions
): CompletionItem[] => {
  const types: readonly ParameterType[] = Array.isArray(type) ? type : [type];
  const requireWritable = options?.writable === true;

  if (ctx.prefix.memberOf !== undefined) {
    const items: CompletionItem[] = [];
    const seen = new Set<string>();
    for (const parameterType of types) {
      for (const entry of suggestMembers(
        ctx,
        parameterType,
        ctx.prefix.memberOf,
        options
      )) {
        pushUnique(items, seen, entry.label, entry.kind, {
          detail: entry.detail,
          insertText: entry.insertText,
          filterText: entry.filterText,
          sortText: entry.sortText,
        });
      }
    }
    return finalizeSuggestions(ctx, items, options);
  }

  const items: CompletionItem[] = [];
  const seen = new Set<string>();
  for (const entry of ctx.snapshot.ast.symbolTable.toArray()) {
    if (!isVisibleAt(entry, ctx.offset)) {
      continue;
    }
    // Internal MegaCrow identity string — usable in scripts, not in suggest.
    if (
      entry.kind === SymbolKind.String &&
      entry.name === MEGACROW_VERSION_STRING_NAME
    ) {
      continue;
    }
    if (requireWritable) {
      if (!matchesWritableParameterType(entry, types)) {
        continue;
      }
    } else if (
      !types.some((parameterType) => matchesParameterType(entry, parameterType))
    ) {
      continue;
    }
    if (
      entry.kind === SymbolKind.Variable &&
      !isBareReferenceScope(entry.scope)
    ) {
      continue;
    }
    const kind: CompletionKind =
      entry.kind === SymbolKind.Constant ? "constant" : "variable";
    pushUnique(items, seen, entry.name, kind, {
      detail: completionDetailForEntry(entry),
    });
  }
  return finalizeSuggestions(ctx, items, options);
};

export const suggestObjectList = (
  ctx: SuggestCtx,
  objectType: ObjectListType,
  options?: { quoted?: boolean }
): CompletionItem[] => {
  // Only wrap when quotes are required and the cursor is not already inside them.
  const wrapInQuotes = options?.quoted === true && !ctx.prefix.quoted;
  const items: CompletionItem[] = [];
  for (const entry of ctx.snapshot.ast.symbolTable.toArray()) {
    if (entry.kind !== SymbolKind.ObjectListItem) {
      continue;
    }
    if (entry.objectType !== objectType) {
      continue;
    }
    const label = entry.name;
    items.push(
      item(label, "enumMember", {
        insertText: wrapInQuotes ? `"${label}"` : label,
        detail: completionDetailForEntry(entry),
      })
    );
  }
  return filterByPrefix(items, ctx.prefix.text);
};

export const suggestSymbolKind = (
  ctx: SuggestCtx,
  kind: SymbolKind,
  options?: SuggestOptions
): CompletionItem[] => {
  const items: CompletionItem[] = [];
  const seen = new Set<string>();
  for (const entry of ctx.snapshot.ast.symbolTable.toArray()) {
    if (entry.kind !== kind) {
      continue;
    }
    if (
      entry.kind === SymbolKind.String &&
      entry.name === MEGACROW_VERSION_STRING_NAME
    ) {
      continue;
    }
    if (options?.ignoreVisibility !== true && !isVisibleAt(entry, ctx.offset)) {
      continue;
    }
    if (
      entry.kind === SymbolKind.Variable &&
      !isBareReferenceScope(entry.scope)
    ) {
      continue;
    }
    pushUnique(items, seen, entry.name, "variable", {
      detail: completionDetailForEntry(entry),
    });
  }
  return finalizeSuggestions(ctx, items, options);
};

/**
 * Team-or-player target: after `team`/`player` keywords suggest typed refs;
 * otherwise suggest kind keywords + `everyone`.
 */
export const suggestTeamOrPlayerTarget = (
  ctx: ActionCompletionContext | ConditionCompletionContext,
  paramStart: number
): CompletionItem[] => {
  const parameters =
    ctx.kind === "action-operands"
      ? ctx.statement.parameters
      : ctx.statement.operands;
  const head = parameters[paramStart];
  if (head?.kind === SyntaxKind.KEYWORD) {
    if (head.value === "team" && ctx.slotIndex === paramStart + 1) {
      return suggestTyped(ctx, ParameterType.Team);
    }
    if (head.value === "player" && ctx.slotIndex === paramStart + 1) {
      return suggestTyped(ctx, ParameterType.Player);
    }
  }

  if (ctx.slotIndex === paramStart) {
    return suggestEnum(ctx, teamOrPlayerTarget);
  }
  return [];
};

/** Player filter: kind keyword, then optional player/team ref. */
export const suggestPlayerFilter = (
  ctx: ActionCompletionContext,
  paramStart: number
): CompletionItem[] => {
  const first = ctx.statement.parameters[paramStart];
  if (first?.kind === SyntaxKind.KEYWORD) {
    if (first.value === "player" && ctx.slotIndex === paramStart + 1) {
      return suggestTyped(ctx, ParameterType.Player);
    }
    if (first.value === "team" && ctx.slotIndex === paramStart + 1) {
      return suggestTyped(ctx, ParameterType.Team);
    }
  }
  if (ctx.slotIndex === paramStart) {
    return suggestEnum(ctx, playerFilterType);
  }
  return [];
};

export const suggestBoolean = (ctx: SuggestCtx): CompletionItem[] =>
  suggestKeywords(ctx, ["true", "false"], "enumMember");

export { ObjectListType, ParameterType, SymbolKind };
