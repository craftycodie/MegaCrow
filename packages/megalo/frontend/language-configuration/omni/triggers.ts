export const TRIGGER_EXECUTION_KINDS = [
  "general",
  "player",
  "random_player",
  "team",
  "object",
  "initialization",
  "local_initialization",
  "host_migration",
  "double_migration",
  "object_death",
  "local",
  "pregame",
] as const;

export type TriggerExecutionKind = (typeof TRIGGER_EXECUTION_KINDS)[number];
