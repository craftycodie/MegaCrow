import { IR, valueWithLocation } from "..";

export function applyMetadata(ir: IR) {
    if (ir.gameVariant.localizedName) {
        ir.gameVariant.baseVariant.metadata.name 
            = valueWithLocation(
                ir.gameVariant.localizedName.toArray()[0]?.english ?? "", 
                ir.gameVariant.localizedName.location
            );
    }
    if (ir.gameVariant.localizedDescription) {
        ir.gameVariant.baseVariant.metadata.description 
            = valueWithLocation(
                ir.gameVariant.localizedDescription.toArray()[0]?.english ?? "", 
                ir.gameVariant.localizedDescription.location
            );
    }

    ir.gameVariant.baseVariant.metadata.creationHistory.timestamp = new Date();
    ir.gameVariant.baseVariant.metadata.modificationHistory.timestamp = new Date();
}