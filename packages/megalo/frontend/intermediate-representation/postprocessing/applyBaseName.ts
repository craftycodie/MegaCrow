import { IR } from "..";
import { FrontendError } from "../../error";
import { BUILT_IN_LOCATION } from "../../diagnostics";
import { STRING_TABLE_LANGUAGES } from "../../language-configuration/omni/strings";
import { StringTableEntry, StringTableReference } from "../game/string_table";

export function applyBaseName(ir: IR) {
  let baseName: StringTableEntry = {
    english: "Custom Game"
  };

  if (ir.baseFilePath) {
    // lookup base name
    throw new FrontendError("NYI", BUILT_IN_LOCATION);
  }
  else if (ir.gameVariant.localizedName) {
    baseName = ir.gameVariant.localizedName.toArray()[0];
  }
  
  ir.gameVariant.baseNameStringIndex = ir.gameVariant.scriptStrings?.addEntry(baseName) ?? 0;
}