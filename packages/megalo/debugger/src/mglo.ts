import { bitstream } from "@blamnetwork/blf";
import { c_game_engine_custom_variant as AlphaCustomVariant } from "@blamnetwork/blf/haloreach/v08516_10_02_19_1607_omaha_alpha";
import { c_game_engine_custom_variant as ReleaseCustomVariant } from "@blamnetwork/blf/haloreach/v11860_10_07_24_0147_omaha_release";
import { c_game_engine_custom_variant as MccCustomVariant } from "@blamnetwork/blf/haloreach_mcc/v_untracked_25_08_16_1352";

const { c_bitstream_reader, e_bitstream_byte_order } = bitstream;

export type MgloGametypeVersion = {
  encodingVersion: number;
  id: string;
  label: string;
};

type CustomVariantCtor = new () => {
  decode(reader: InstanceType<typeof c_bitstream_reader>): void;
  m_encoding_version: number;
  m_build_number: number;
};

const GAMETYPE_BY_ENCODING: Record<
  number,
  { id: string; label: string; Variant: CustomVariantCtor }
> = {
  49: {
    id: "49",
    label: "Halo Reach Xbox 360 Alpha",
    Variant: AlphaCustomVariant as CustomVariantCtor,
  },
  106: {
    id: "106",
    label: "Halo Reach Xbox 360 Release",
    Variant: ReleaseCustomVariant as CustomVariantCtor,
  },
  // Encoding 107 is shared by TU1 and MCC; `.mglo` hot-reload uses the MCC layout.
  107: {
    id: "107-mcc",
    label: "Halo Reach MCC",
    Variant: MccCustomVariant as CustomVariantCtor,
  },
};

export type DecodedMglo = {
  version: MgloGametypeVersion;
  buildNumber: number;
  gametype: unknown;
};

/** Peek the signed 32-bit encoding version at the start of an `.mglo` bitstream. */
export function readMgloEncodingVersion(bytes: Uint8Array): number {
  if (bytes.length < 4) {
    throw new Error("File is too small to be a valid .mglo gametype.");
  }

  const reader = c_bitstream_reader.new(
    bytes,
    e_bitstream_byte_order._bitstream_byte_order_big_endian,
  );
  reader.begin_reading();
  return reader.read_signed_integer("encoding-version", 32);
}

export function resolveGametypeVersion(
  encodingVersion: number,
): MgloGametypeVersion & { Variant: CustomVariantCtor } {
  const resolved = GAMETYPE_BY_ENCODING[encodingVersion];
  if (!resolved) {
    throw new Error(
      `Unsupported encoding version ${encodingVersion}. Supported: ${Object.keys(GAMETYPE_BY_ENCODING).join(", ")}.`,
    );
  }

  return {
    encodingVersion,
    id: resolved.id,
    label: resolved.label,
    Variant: resolved.Variant,
  };
}

/** Decode a hot-reload `.mglo` custom-variant bitstream. */
export function decodeMglo(bytes: Uint8Array): DecodedMglo {
  const encodingVersion = readMgloEncodingVersion(bytes);
  const version = resolveGametypeVersion(encodingVersion);

  const reader = c_bitstream_reader.new(
    bytes,
    e_bitstream_byte_order._bitstream_byte_order_big_endian,
  );
  reader.begin_reading();
  const gametype = new version.Variant();
  gametype.decode(reader);

  return {
    version: {
      encodingVersion: version.encodingVersion,
      id: version.id,
      label: version.label,
    },
    buildNumber: gametype.m_build_number,
    gametype,
  };
}

export function toPlainJson(value: unknown): unknown {
  return JSON.parse(
    JSON.stringify(value, (_key, current) => {
      if (typeof current === "bigint") {
        return current.toString();
      }
      return current;
    }),
  );
}
