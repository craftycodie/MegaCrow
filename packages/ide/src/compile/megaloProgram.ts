/**
 * Legacy empty program shape still plumbed through IDE compile/metadata paths.
 * Real AST work lives in `@megacrow/megalo` / the LSP; this is only a placeholder
 * until remaining `baseProgram` / metadata call sites are deleted.
 */

export interface ParseWarning {
  column: number;
  length?: number;
  line: number;
  message: string;
  offset?: number;
}

export interface MegaloEngineData {
  category?: string;
  description: string;
  icon?: string;
  name: string;
}

export interface MegaloStringTableEntry {
  column?: number;
  line?: number;
  symbol: string;
  value: string;
}

export interface MegaloStringTableElement {
  entries: MegaloStringTableEntry[];
  language: string;
  type: "string_table";
}

export type MegaloElement =
  | { type: "include"; path: string }
  | { type: "localized_include"; path: string }
  | { type: "base"; path: string }
  | MegaloStringTableElement
  | { type: "engine_data"; data: MegaloEngineData }
  | { type: "trigger"; trigger: MegaloTrigger }
  | { type: "unknown"; keyword: string };

export type MegaloExpr =
  | { kind: "identifier"; name: string }
  | { kind: "number"; value: number }
  | { kind: "string"; value: string }
  | { kind: "bool"; value: boolean }
  | { kind: "member"; base: MegaloExpr; member: string };

export interface MegaloCondition {
  executeBeforeAction: number;
  executionMode?: string;
  keyword: string;
  negated: boolean;
  operands: MegaloExpr[];
  unionGroup: number;
  unionOr: boolean;
}

export interface MegaloAction {
  executionMode?: string;
  opcode: string;
  operands: MegaloExpr[];
}

export interface MegaloTrigger {
  actions: MegaloStatement[];
  conditions: MegaloStatement[];
  kind: string;
  name: string;
  objectFilter?: string;
}

export type MegaloStatement =
  | { type: "condition"; condition: MegaloCondition }
  | { type: "action"; action: MegaloAction }
  | { type: "trigger"; trigger: MegaloTrigger };

export interface MegaloTriggerBinding {
  actionCount: number;
  conditionCount: number;
  kind: string;
  name: string;
}

export interface MegaloProgram {
  buildNumber: number;
  elements: MegaloElement[];
  encodingVersion: number;
  flatActions: MegaloAction[];
  flatConditions: MegaloCondition[];
  specialTriggers: {
    initialization: number;
    localInitialization: number;
    hostMigration: number;
    doubleMigration: number;
    objectDeathEvent: number;
    local: number;
    pregame: number;
  };
  stringSymbolOrder?: string[];
  triggerTable: MegaloTriggerBinding[];
}

const EMPTY_SPECIAL = {
  initialization: -1,
  localInitialization: -1,
  hostMigration: -1,
  doubleMigration: -1,
  objectDeathEvent: -1,
  local: -1,
  pregame: -1,
};

export function emptyMegaloProgram(): MegaloProgram {
  return {
    elements: [],
    flatConditions: [],
    flatActions: [],
    triggerTable: [],
    specialTriggers: { ...EMPTY_SPECIAL },
    encodingVersion: 107,
    buildNumber: -1,
  };
}

/** Always succeeds with an empty program — parsing is done by the LSP / compiler. */
export function tryParse(
  _source: string
):
  | { ok: true; program: MegaloProgram; warnings: ParseWarning[] }
  | { ok: false; line: number; column: number; message: string } {
  return { ok: true, program: emptyMegaloProgram(), warnings: [] };
}
