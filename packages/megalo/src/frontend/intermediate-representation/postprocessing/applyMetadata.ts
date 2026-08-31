import type { IR } from "src/frontend/intermediate-representation";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";

function englishFromScriptString(
  ir: IR,
  oneBasedIndex: number
): string | undefined {
  if (oneBasedIndex <= 0) {
    return;
  }
  const entry = ir.gameVariant.scriptStrings.toArray()[oneBasedIndex - 1];
  const text = entry?.english?.trim();
  return text ? text : undefined;
}

/** Content-item history name field is a fixed 16-char string. */
const resolveAuthorName = (creatorGamertag: string): string => {
  const trimmed = creatorGamertag.trim().slice(0, 16);
  return trimmed.length > 0 ? trimmed : "MegaloEvolved";
};

export function applyMetadata(ir: IR, ctx: ElementLowerContext) {
  if (ir.gameVariant.localizedName) {
    const name = ir.gameVariant.localizedName.toArray()[0]?.english ?? "";
    const location = ir.locations.get(ir.gameVariant, "localizedName");
    ir.gameVariant.baseVariant.metadata.name = name;
    if (location !== undefined) {
      ir.locations.record(
        ir.gameVariant.baseVariant.metadata,
        "name",
        location
      );
    }
  } else {
    const name = englishFromScriptString(
      ir,
      ir.gameVariant.baseNameStringIndex
    );
    if (name !== undefined) {
      ir.gameVariant.baseVariant.metadata.name = name;
    }
  }
  if (ir.gameVariant.localizedDescription) {
    const description =
      ir.gameVariant.localizedDescription.toArray()[0]?.english ?? "";
    const location = ir.locations.get(ir.gameVariant, "localizedDescription");
    ir.gameVariant.baseVariant.metadata.description = description;
    if (location !== undefined) {
      ir.locations.record(
        ir.gameVariant.baseVariant.metadata,
        "description",
        location
      );
    }
  }

  const author = resolveAuthorName(
    ctx.frontend.compilerSettings.creatorGamertag
  );
  const now = new Date();
  ir.gameVariant.baseVariant.metadata.creationHistory.timestamp = now;
  ir.gameVariant.baseVariant.metadata.creationHistory.name = author;
  ir.gameVariant.baseVariant.metadata.modificationHistory.timestamp = now;
  ir.gameVariant.baseVariant.metadata.modificationHistory.name = author;
}
