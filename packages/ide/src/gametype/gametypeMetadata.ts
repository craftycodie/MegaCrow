import {
  type CompiledMegaloMetadata,
  getLabel,
  MEGALO_VERSIONS,
  type MegaloVersionId,
  pickLocalizedStringTableText,
} from "@megacrow/megalo";
import type { MegaloIncludeFileCache } from "../compile/includeDiagnostics";
import { megaloCompileOptionsFromCache } from "../compile/includeDiagnostics";
import { tryExpandMegaloIncludes } from "../compile/megaloIncludeScan";
import {
  type MegaloEngineData,
  type MegaloProgram,
  tryParse,
} from "../compile/megaloProgram";
import { translate } from "../localization";
import {
  getObjectListIconUrl,
  getReachGametypeIconUrl,
  megaloIconSymbolToIndex,
} from "./gametypeIcons";
import {
  isObjectListsPath,
  isRecognizedObjectListName,
} from "./objectListsPath";

export type MegaloVersionProfileId = MegaloVersionId;

export interface VariantIdentity {
  description: string | null;
  /** Engine icon index, or `null` when unset (do not treat as CTF/0). */
  iconIndex: number | null;
  /** Reach fileshare icon URL, or `null` when no icon should be shown. */
  iconUrl: string | null;
  /** Document kind — object lists always show their sidebar icon. */
  kind?: "gametype" | "object-list";
  name: string;
}

export interface MetadataField {
  chip?: string;
  editable?: boolean;
  label: string;
  secondary?: string;
  value: string;
}

export interface MetadataSection {
  fields: MetadataField[];
  title: string;
}

export interface GametypeMetadata {
  elements: MetadataSection[];
  loaded: boolean;
  variantIdentity: VariantIdentity | null;
}

export const MEGALO_VERSION_LABELS: Record<MegaloVersionProfileId, string> =
  Object.fromEntries(
    (Object.keys(MEGALO_VERSIONS) as MegaloVersionId[]).map((id) => [
      id,
      getLabel(MEGALO_VERSIONS[id]),
    ])
  ) as Record<MegaloVersionProfileId, string>;

function formatBytes(bytes: number): string {
  if (bytes < 1024) {
    return `${bytes} B`;
  }
  if (bytes < 1024 * 1024) {
    return `${(bytes / 1024).toFixed(1)} KB`;
  }
  return `${(bytes / (1024 * 1024)).toFixed(2)} MB`;
}

/** Basename without directory; strips common gametype/script extensions. */
export function displayFileStem(fileName: string | null | undefined): string {
  if (!fileName) {
    return "";
  }
  const base = fileName.replace(/\\/g, "/").split("/").pop() ?? fileName;
  return base.replace(/\.(bin|blf|meg|txt|mglo)$/i, "");
}

function formatTimestamp(date: Date | null | undefined): string {
  if (!date || Number.isNaN(date.getTime())) {
    return "—";
  }
  return date.toLocaleString();
}

function formatXuid(xuid: bigint | null | undefined): string {
  if (xuid === null || xuid === undefined || xuid === 0n) {
    return "—";
  }
  return `0x${xuid.toString(16).toUpperCase()}`;
}

/** Reach stores Bungie-authored content under the broken-bar placeholder name. */
function formatAuthorName(name: string): string {
  const trimmed = name.trim();
  if (trimmed === "¦") {
    return "Bungie";
  }
  return trimmed;
}

/** Parse Megalo source, expanding workspace includes when a cache is available. */
export function parseProgramWithIncludes(
  source: string,
  includeCache?: MegaloIncludeFileCache
): MegaloProgram | null {
  if (includeCache?.sourceDir) {
    const expanded = tryExpandMegaloIncludes(
      source,
      megaloCompileOptionsFromCache(includeCache)
    );
    if (expanded.ok) {
      const parsed = tryParse(expanded.source);
      return parsed.ok ? parsed.program : null;
    }
  }
  const parsed = tryParse(source);
  return parsed.ok ? parsed.program : null;
}

export function resolveProgram(
  source: string,
  baseProgram: MegaloProgram | null,
  baselineSource?: string | null,
  includeCache?: MegaloIncludeFileCache
): MegaloProgram | null {
  const useBaseline =
    baseProgram &&
    baselineSource !== undefined &&
    baselineSource !== null &&
    source === baselineSource &&
    !includeCache?.sourceDir;

  if (useBaseline) {
    return baseProgram;
  }

  const parsed = parseProgramWithIncludes(source, includeCache);
  if (!parsed) {
    return baseProgram;
  }
  if (!baseProgram) {
    return parsed;
  }
  return {
    ...parsed,
    encodingVersion: baseProgram.encodingVersion,
    buildNumber: baseProgram.buildNumber,
    stringSymbolOrder:
      parsed.stringSymbolOrder ?? baseProgram.stringSymbolOrder,
  };
}

function findEngineData(
  program: MegaloProgram | null
): MegaloEngineData | null {
  if (!program) {
    return null;
  }
  for (const element of program.elements) {
    if (element.type === "engine_data") {
      return element.data;
    }
  }
  return null;
}

function resolveStringSymbol(
  program: MegaloProgram,
  symbol: string,
  fallbackProgram?: MegaloProgram | null
): string {
  void program;
  void fallbackProgram;
  return symbol.trim().replace(/^["']|["']$/g, "");
}

function normalizeEngineIconIndex(
  icon: number | null | undefined
): number | null {
  if (icon === null || icon === undefined || icon < 0) {
    return null;
  }
  return icon;
}

function readBinaryVariantIdentity(_fileBytes: Uint8Array | null): {
  name: string;
  description: string;
  iconIndex: number | null;
} | null {
  return null;
}

function resolveVariantIdentity(options: {
  program: MegaloProgram | null;
  baseProgram?: MegaloProgram | null;
  fileName: string | null;
  fileBytes: Uint8Array | null;
}): VariantIdentity | null {
  const { program, baseProgram, fileName, fileBytes } = options;
  const engineData = findEngineData(program);
  const binary = readBinaryVariantIdentity(fileBytes);

  let iconIndex: number | null = binary?.iconIndex ?? null;
  if (engineData?.icon) {
    iconIndex = megaloIconSymbolToIndex(engineData.icon);
  }

  let name = "";
  if (engineData?.name && program) {
    name = resolveStringSymbol(program, engineData.name, baseProgram);
  }
  if (!name && binary?.name) {
    name = binary.name;
  }
  if (!name && fileName) {
    name = displayFileStem(fileName);
  }

  if (!name) {
    return null;
  }

  let description: string | null = null;
  if (engineData?.description && program) {
    const resolved = resolveStringSymbol(
      program,
      engineData.description,
      baseProgram
    ).trim();
    if (resolved) {
      description = resolved;
    }
  }
  if (!description && binary?.description) {
    description = binary.description;
  }

  return {
    name,
    description,
    iconIndex,
    iconUrl: getReachGametypeIconUrl(iconIndex),
  };
}

function readBinaryHistory(_fileBytes: Uint8Array | null): {
  createdName: string;
  createdXuid: bigint;
  createdAt: Date;
  modifiedXuid: bigint;
} | null {
  return null;
}

function sourceByteLength(source: string): number {
  return new TextEncoder().encode(source).length;
}

function displayLocalizedString(
  value: CompiledMegaloMetadata["name"] | undefined
): string {
  return pickLocalizedStringTableText(value);
}

export function buildVariantIdentity(options: {
  source: string;
  baseProgram: MegaloProgram | null;
  baselineSource?: string | null;
  fileName: string | null;
  /** Absolute path when available (preferred for object-list detection). */
  absoluteFilePath?: string | null;
  /** Version-recognized object list filenames (e.g. `objects.txt`). */
  objectListNames?: readonly string[];
  fileBytes: Uint8Array | null;
  includeCache?: MegaloIncludeFileCache;
  /** Prefer compiler-emitted metadata when a compile succeeded. */
  compiledMetadata?: CompiledMegaloMetadata | null;
}): VariantIdentity | null {
  const pathForKind = options.absoluteFilePath ?? options.fileName;
  const basename =
    (options.fileName ?? pathForKind)?.replace(/\\/g, "/").split("/").pop() ??
    "";
  if (
    isObjectListsPath(pathForKind) &&
    basename.length > 0 &&
    isRecognizedObjectListName(basename, options.objectListNames ?? [])
  ) {
    const name = displayFileStem(options.fileName ?? pathForKind);
    if (!name) {
      return null;
    }
    return {
      kind: "object-list",
      name,
      description: "object list",
      iconIndex: null,
      iconUrl: getObjectListIconUrl(),
    };
  }

  if (options.compiledMetadata) {
    const iconIndex = normalizeEngineIconIndex(
      options.compiledMetadata.engineIcon
    );
    const name =
      displayLocalizedString(options.compiledMetadata.name) ||
      displayFileStem(options.fileName) ||
      "";
    if (!name) {
      return null;
    }
    const description =
      displayLocalizedString(options.compiledMetadata.description) || null;
    return {
      name,
      description,
      iconIndex,
      iconUrl: getReachGametypeIconUrl(iconIndex),
    };
  }

  const program = resolveProgram(
    options.source,
    options.baseProgram,
    options.baselineSource,
    options.includeCache
  );
  return resolveVariantIdentity({
    program,
    baseProgram: options.baseProgram,
    fileName: options.fileName,
    fileBytes: options.fileBytes,
  });
}

export function buildGametypeMetadata(options: {
  source: string;
  baseProgram: MegaloProgram | null;
  fileName: string | null;
  fileBytes: Uint8Array | null;
  megaloVersionId: MegaloVersionProfileId;
  authorName: string;
  lastRecompiledAt: Date | null;
  compiledSize: number | null;
  includeCache?: MegaloIncludeFileCache;
}): GametypeMetadata {
  const {
    source,
    baseProgram,
    fileName,
    fileBytes,
    megaloVersionId,
    authorName,
    lastRecompiledAt,
    compiledSize,
    includeCache,
  } = options;

  if (!(baseProgram || fileName)) {
    return { elements: [], loaded: false, variantIdentity: null };
  }

  const program = resolveProgram(source, baseProgram, undefined, includeCache);
  const history = readBinaryHistory(fileBytes);
  const profileLabel = MEGALO_VERSION_LABELS[megaloVersionId];
  const variantIdentity = resolveVariantIdentity({
    program,
    baseProgram,
    fileName,
    fileBytes,
  });

  const elements: MetadataSection[] = [
    {
      title: translate("metadata_section_file"),
      fields: [
        { label: translate("metadata_label_name"), value: fileName ?? "—" },
        {
          label: translate("metadata_label_size_txt"),
          value: formatBytes(sourceByteLength(source)),
        },
        {
          label: translate("metadata_label_size_compiled"),
          value: compiledSize === null ? "—" : formatBytes(compiledSize),
        },
      ],
    },
    {
      title: translate("metadata_section_modified_by"),
      fields: [
        {
          label: translate("metadata_label_name"),
          value: authorName,
          editable: true,
        },
        {
          label: translate("metadata_label_xuid"),
          value: formatXuid(history?.modifiedXuid),
        },
        {
          label: translate("metadata_label_at"),
          value: formatTimestamp(lastRecompiledAt),
        },
      ],
    },
    {
      title: translate("metadata_section_created_by"),
      fields: [
        {
          label: translate("metadata_label_name"),
          value: formatAuthorName(history?.createdName ?? "") || "—",
        },
        {
          label: translate("metadata_label_xuid"),
          value: formatXuid(history?.createdXuid),
        },
        {
          label: translate("metadata_label_at"),
          value: formatTimestamp(history?.createdAt),
        },
      ],
    },
    {
      title: translate("metadata_section_variant", { profile: profileLabel }),
      fields: [
        {
          label: translate("metadata_label_encoding_version"),
          value: program === null ? "—" : String(program.encodingVersion),
        },
        {
          label: translate("metadata_label_build_number"),
          value: program === null ? "—" : String(program.buildNumber),
          ...(program?.buildNumber === -1 ? { chip: "untracked" } : {}),
        },
      ],
    },
  ];

  return { elements, loaded: true, variantIdentity };
}
