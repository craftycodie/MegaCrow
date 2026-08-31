import { useMemo } from "react";
import type {
  MegaloIncludeFileCache,
  MegaloProgram,
  SourceAnalysis,
} from "../compile";
import { buildVariantIdentity } from "../gametype";
import { useIdeLocale, useT } from "../localization";

interface Props {
  absoluteFilePath?: string | null;
  baselineSource?: string | null;
  baseProgram: MegaloProgram | null;
  compiledMetadata?: SourceAnalysis["compiledMetadata"];
  fileBytes: Uint8Array | null;
  fileName: string | null;
  includeCache?: MegaloIncludeFileCache;
  objectListNames?: readonly string[];
  source: string;
}

export function SidebarVariantHeader({
  source,
  baseProgram,
  baselineSource,
  fileName,
  absoluteFilePath,
  fileBytes,
  includeCache,
  objectListNames = [],
  compiledMetadata,
}: Props) {
  const t = useT();
  const { locale } = useIdeLocale();
  const variantIdentity = useMemo(
    () =>
      buildVariantIdentity({
        source,
        baseProgram,
        baselineSource,
        fileName,
        absoluteFilePath,
        objectListNames,
        fileBytes,
        includeCache,
        compiledMetadata,
      }),
    [
      source,
      baseProgram,
      baselineSource,
      fileName,
      absoluteFilePath,
      objectListNames,
      fileBytes,
      includeCache,
      compiledMetadata,
      locale,
    ]
  );

  if (!variantIdentity) {
    return (
      <div className="sidebar-variant sidebar-variant--empty">
        <div className="sidebar-variant-text">
          <p className="sidebar-variant-hint">
            {t("sidebar_variant_empty_hint")}
          </p>
        </div>
      </div>
    );
  }

  const iconUrl = variantIdentity.iconUrl;

  return (
    <div className="sidebar-variant">
      <div className="sidebar-variant-icon-slot">
        {iconUrl ? (
          <img alt="" className="sidebar-variant-icon" src={iconUrl} />
        ) : (
          <div
            className="sidebar-variant-icon-placeholder"
            title={t("sidebar_variant_no_icon")}
          >
            <span className="sidebar-variant-icon-placeholder-label">
              {t("sidebar_variant_no_icon")}
            </span>
          </div>
        )}
      </div>
      <div className="sidebar-variant-text">
        <h2 className="sidebar-variant-name">{variantIdentity.name}</h2>
        {variantIdentity.description ? (
          <p className="sidebar-variant-description">
            {variantIdentity.description}
          </p>
        ) : (
          <p className="sidebar-variant-description sidebar-variant-description--empty">
            &nbsp;
          </p>
        )}
      </div>
    </div>
  );
}
