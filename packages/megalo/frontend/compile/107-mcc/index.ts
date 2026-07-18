import {
  c_game_engine_custom_variant,
  c_string_table,
  e_file_type,
  s_content_item_game_variant_metadata,
} from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";
import { bitstream } from "@blamnetwork/blf";

const { c_bitstream_writer, e_bitstream_byte_order } = bitstream;
import { BUILT_IN_LOCATION, type Diagnostics } from "../../diagnostics";
import type { IR } from "../../intermediate-representation";
import type { StringTable } from "../../intermediate-representation/game/string_table";
import { STRING_TABLE_LANGUAGES } from "../../language-configuration/omni/strings";
import { Compiler } from "../compiler";
import { FrontendError } from "../../error";

export class Compiler107MCC extends Compiler {
  private compileStringTable(
    irStrings: StringTable,
    maxStringCount: number,
    maxStringLength: number,
    offsetBitLength: number,
    bufferSizeBitLength: number,
    countBitLength: number
  ): c_string_table {
    const table = new c_string_table(
      maxStringCount,
      maxStringLength,
      offsetBitLength,
      bufferSizeBitLength,
      countBitLength
    );

    const entries = irStrings.toArray();
    table.strings = STRING_TABLE_LANGUAGES.map((language) =>
      entries.map((entry) => entry[language] ?? null)
    );

    return table;
  }

  private makeDefaultGametype(): c_game_engine_custom_variant {
    const gametype = new c_game_engine_custom_variant();
    gametype.initialize();
    gametype.m_build_number = -1;
    gametype.m_base_variant.m_metadata.general.file_type = e_file_type.GameVariant;
    gametype.m_base_variant.m_metadata.file_type_data =
      new s_content_item_game_variant_metadata();
    return gametype;
  }

  private compile(ir: IR): c_game_engine_custom_variant {
    const gametype = this.makeDefaultGametype();

    gametype.m_script_strings = this.compileStringTable(
        ir.gameVariant.scriptStrings,
        112,
        0x4c_00,
        15,
        15,
        7
    );

    if (ir.gameVariant.localizedName) {
      (gametype.m_localized_name = this.compileStringTable(
        ir.gameVariant.localizedName,
        1,
        0x1_80,
        9,
        9,
        1
      ));
    }
    ir.gameVariant.localizedDescription &&
      (gametype.m_localized_description = this.compileStringTable(
        ir.gameVariant.localizedDescription,
        1,
        0xc_00,
        12,
        12,
        1
      ));
    ir.gameVariant.localizedCategory &&
      (gametype.m_localized_category = this.compileStringTable(
        ir.gameVariant.localizedCategory,
        1,
        0x1_80,
        9,
        9,
        1
      ));
    if (ir.gameVariant.engineIcon !== undefined) {
      gametype.m_engine_icon = Number(ir.gameVariant.engineIcon);
      gametype.m_base_variant.m_metadata.file_type_data = new s_content_item_game_variant_metadata();
      gametype.m_base_variant.m_metadata.file_type_data.icon_index = ir.gameVariant.engineIcon;
    }
    if (ir.gameVariant.engineCategory !== undefined) {
        // this is actually an enum, we havent mapped it yet
        // TODO add e_game_engine_category to blf-ts
      gametype.m_engine_category = ir.gameVariant.engineCategory;
      gametype.m_base_variant.m_metadata.display.megalo_category_index = ir.gameVariant.engineCategory;
    }
    if (ir.gameVariant.baseVariant.metadata.name) {
      gametype.m_base_variant.m_metadata.name = ir.gameVariant.baseVariant.metadata.name;
    }
    if (ir.gameVariant.baseVariant.metadata.description) {
      gametype.m_base_variant.m_metadata.description = ir.gameVariant.baseVariant.metadata.description;
    }

    // TODO: Move
    gametype.m_base_variant.m_metadata.general.activity = 3;
    gametype.m_base_variant.m_metadata.general.game_mode = 3;
    gametype.m_base_variant.m_metadata.general.game_engine_type = 2;


    gametype.m_base_name_string_index = ir.gameVariant.baseNameStringIndex;

    return gametype;
  }

  public dryRun(ir: IR, diagnostics: Diagnostics): void {
    this.compile(ir);
  }

  public writeMegaloFile(ir: IR, diagnostics: Diagnostics): Uint8Array {
    const gametype = this.compile(ir);
    const bitstreamWriter = c_bitstream_writer.new(
      0,
      e_bitstream_byte_order._bitstream_byte_order_big_endian
    );
    bitstreamWriter.begin_writing();
    gametype.encode(bitstreamWriter);
    bitstreamWriter.finish_writing();
    return bitstreamWriter.get_data();
  }
}
