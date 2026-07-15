import { IR, valueWithLocation } from "..";
import { BUILT_IN_LOCATION } from "../../diagnostics";
import { ActionType } from "../game/megalogamengine/megalogamengine_actions";

export function applyDefaultLoadoutCameraTime(ir: IR) {    
    const hasNoBaseFilePath = !ir.baseFilePath;
    const hasNoLoadoutCamTime = ir.gameVariant.baseVariant.respawnOptions?.loadoutCamTime == undefined;
    const usesSetLoadoutPalette = ir.gameVariant.gameEngine.actions.some(action => action.type === ActionType.SetLoadoutPalette);
    if (hasNoBaseFilePath && hasNoLoadoutCamTime && usesSetLoadoutPalette) {
        ir.gameVariant.baseVariant.respawnOptions.loadoutCamTime = valueWithLocation(10.0, BUILT_IN_LOCATION);
    }
    return ir;
}