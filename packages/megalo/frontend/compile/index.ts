import type { SupportedMegaloVersion } from "../../version";
import { Compiler107MCC } from "./107-mcc";
import type { Compiler } from "./compiler";

export { Compiler } from "./compiler";

export const getCompilerForVersion = ({
  version,
  flavour,
}: SupportedMegaloVersion): Compiler => {
  switch (version) {
    case 107: {
      switch (flavour) {
        case "mcc":
          return new Compiler107MCC();
        default:
          throw new Error(`Unsupported flavour: ${flavour}`);
      }
    }
  }

  throw new Error(`Unsupported version: ${version}`);
};
