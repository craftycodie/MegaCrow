import { parseBaseDirective } from "../compile/megaloBaseDirective";

export { parseBaseDirective };

export function readBaseDirective(source: string): string | null {
  return parseBaseDirective(source)?.path ?? null;
}
