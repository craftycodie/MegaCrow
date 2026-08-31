import { diagnosticMessages } from "src/diagnostics/messages";
import { SyntaxKind } from "src/frontend/abstract-syntax-tree";
import {
  type OverrideEntryNode,
  OverrideValueKind,
} from "src/frontend/abstract-syntax-tree/elements/game_options";
import { dxAssertionScope } from "src/frontend/intermediate-representation/diagnostics";
import { applyBuiltinLockHide } from "src/frontend/intermediate-representation/elements/game_options/override/helpers";
import { lowerLoadoutPaletteOverride } from "src/frontend/intermediate-representation/elements/game_options/override/loadoutPalette";
import { tryLowerMapOverride } from "src/frontend/intermediate-representation/elements/game_options/override/map";
import { tryLowerMiscOverride } from "src/frontend/intermediate-representation/elements/game_options/override/misc";
import { lowerPlayerTraitsOverride } from "src/frontend/intermediate-representation/elements/game_options/override/playerTraits";
import { tryLowerRespawnOverride } from "src/frontend/intermediate-representation/elements/game_options/override/respawn";
import { tryLowerSocialOverride } from "src/frontend/intermediate-representation/elements/game_options/override/social";
import { tryLowerTu1Override } from "src/frontend/intermediate-representation/elements/game_options/override/tu1";
import { LowerError } from "src/frontend/intermediate-representation/error";
import type { ElementLowerContext } from "src/frontend/intermediate-representation/parameters/context";

export const lowerOverride = (
  entry: OverrideEntryNode,
  ctx: ElementLowerContext
) => {
  const { diagnostics, ir } = ctx;
  dxAssertionScope(diagnostics, () => {
    const { name } = entry;

    if (name.kind === SyntaxKind.INVALID) {
      return;
    }

    if (name.kind === "loadout_palette") {
      lowerLoadoutPaletteOverride(entry, ctx);
      return;
    }

    if (name.kind === "player_traits_override") {
      lowerPlayerTraitsOverride(entry, ctx);
      return;
    }

    const optionName = name.identifier;
    applyBuiltinLockHide(
      ir,
      diagnostics,
      optionName,
      entry.modifiers,
      entry.location
    );

    if (entry.value.kind === SyntaxKind.INVALID) {
      throw new LowerError(
        diagnosticMessages.expectedOneOf(["identifier"], "invalid"),
        entry.value.location
      );
    }

    if (entry.value.kind !== OverrideValueKind.SIMPLE) {
      throw new LowerError(
        diagnosticMessages.expectedParameterType("override value", ""),
        entry.location
      );
    }

    const handled =
      tryLowerMiscOverride(optionName, entry, ctx) ||
      tryLowerRespawnOverride(optionName, entry, ctx) ||
      tryLowerSocialOverride(optionName, entry, ctx) ||
      tryLowerMapOverride(optionName, entry, ctx) ||
      tryLowerTu1Override(optionName, entry, ctx);

    if (!handled) {
      throw new LowerError(
        diagnosticMessages.unknownGameOptionOverride(optionName),
        entry.location
      );
    }
  });
};
