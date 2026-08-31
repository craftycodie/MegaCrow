import type { VariantLimitItem, VariantLimitUsage } from "@megacrow/megalo";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { formatVariantBytes, variantCapacityLevel } from "../gametype";
import { type IdeMessageKey, useT } from "../localization";
import { usePopoverPosition } from "../ui/usePopoverPosition";

const PANEL_WIDTH = 360;
const PANEL_MAX_HEIGHT = 520;

const VARIABLE_SCOPE_ORDER = [
  "Global",
  "Player",
  "Team",
  "Object",
  "Temporary",
] as const;

const SCOPE_LABEL_KEYS: Record<
  (typeof VARIABLE_SCOPE_ORDER)[number] | "Other",
  IdeMessageKey
> = {
  Global: "variant_scope_global",
  Player: "variant_scope_player",
  Team: "variant_scope_team",
  Object: "variant_scope_object",
  Temporary: "variant_scope_temporary",
  Other: "variant_scope_other",
};

type Translate = ReturnType<typeof useT>;

type PopoverSection =
  | {
      id: string;
      items: VariantLimitItem[];
      kind: "meters";
      title: string;
    }
  | {
      id: string;
      items: VariantLimitItem[];
      kind: "variables";
      title: string;
    };

function formatLimitValue(item: VariantLimitItem): string {
  if (item.format === "bytes") {
    return `${formatVariantBytes(item.used)} / ${formatVariantBytes(item.max)}`;
  }
  return `${item.used.toLocaleString()} / ${item.max.toLocaleString()}`;
}

function splitVariableLabel(label: string): { scope: string; type: string } {
  const match = /^(\S+)\s+(.+)$/.exec(label);
  return {
    scope: match?.[1] ?? "Other",
    type: match?.[2] ?? label,
  };
}

function localizeScope(scope: string, t: Translate): string {
  const key = SCOPE_LABEL_KEYS[scope as keyof typeof SCOPE_LABEL_KEYS];
  return key ? t(key) : scope;
}

function buildPopoverSections(
  items: VariantLimitItem[],
  t: Translate
): PopoverSection[] {
  const bySection = {
    storage: items.filter((item) => item.section === "storage"),
    script: items.filter((item) => item.section === "script"),
    strings: items.filter((item) => item.section === "strings"),
    variables: items.filter((item) => item.section === "variables"),
    declarations: items.filter((item) => item.section === "declarations"),
  };

  const sections: PopoverSection[] = [];

  if (bySection.storage.length > 0) {
    sections.push({
      id: "storage",
      kind: "meters",
      title: t("variant_section_storage"),
      items: bySection.storage,
    });
  }
  if (bySection.script.length > 0) {
    sections.push({
      id: "script",
      kind: "meters",
      title: t("variant_section_script"),
      items: bySection.script,
    });
  }
  if (bySection.strings.length > 0) {
    sections.push({
      id: "strings",
      kind: "meters",
      title: t("variant_section_strings"),
      items: bySection.strings,
    });
  }

  const varsByScope = new Map<string, VariantLimitItem[]>();
  for (const item of bySection.variables) {
    const { scope, type } = splitVariableLabel(item.label);
    const scoped: VariantLimitItem = { ...item, label: type };
    const list = varsByScope.get(scope);
    if (list) {
      list.push(scoped);
    } else {
      varsByScope.set(scope, [scoped]);
    }
  }
  for (const scope of VARIABLE_SCOPE_ORDER) {
    const scopeItems = varsByScope.get(scope);
    if (!scopeItems) {
      continue;
    }
    sections.push({
      id: `variables-${scope}`,
      kind: "variables",
      title: t("variant_section_variables", {
        scope: localizeScope(scope, t),
      }),
      items: scopeItems,
    });
    varsByScope.delete(scope);
  }
  for (const [scope, scopeItems] of varsByScope) {
    sections.push({
      id: `variables-${scope}`,
      kind: "variables",
      title: t("variant_section_variables", {
        scope: localizeScope(scope, t),
      }),
      items: scopeItems,
    });
  }

  if (bySection.declarations.length > 0) {
    sections.push({
      id: "declarations",
      kind: "meters",
      title: t("variant_section_declarations"),
      items: bySection.declarations,
    });
  }

  return sections;
}

function LimitRow({ item }: { item: VariantLimitItem }) {
  const level = variantCapacityLevel(item.used, item.max);
  const fillPercent =
    item.max > 0 ? Math.min(100, (item.used / item.max) * 100) : 0;

  return (
    <div className={`variant-limit-row variant-limit-row--${level}`}>
      <div className="variant-limit-row-head">
        <span className="variant-limit-row-label">{item.label}</span>
        <span className="variant-limit-row-value">
          {formatLimitValue(item)}
        </span>
      </div>
      <div aria-hidden className="variant-limit-row-track">
        <div
          className="variant-limit-row-fill"
          style={{ width: `${fillPercent}%` }}
        />
      </div>
    </div>
  );
}

interface Props {
  capacityBytes: number;
  limitUsage: VariantLimitUsage | null;
  usedBytes: number | null;
}

export function VariantCapacityMeter({
  usedBytes,
  capacityBytes,
  limitUsage,
}: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const { panelPos, panelRef, rootRef, triggerRef } = usePopoverPosition(open, {
    panelWidth: PANEL_WIDTH,
    direction: "up",
    offsetY: 6,
    alignRight: true,
  });

  useEffect(() => {
    if (!open) {
      return;
    }

    const onPointerDown = (event: MouseEvent) => {
      const target = event.target as Node;
      if (
        rootRef.current?.contains(target) ||
        panelRef.current?.contains(target)
      ) {
        return;
      }
      setOpen(false);
    };

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
      }
    };

    window.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [open, panelRef, rootRef]);

  if (usedBytes === null) {
    return null;
  }

  const level = variantCapacityLevel(usedBytes, capacityBytes);
  const percent = Math.round((usedBytes / capacityBytes) * 100);
  const fillPercent = Math.min(100, (usedBytes / capacityBytes) * 100);
  const over = usedBytes > capacityBytes;

  const items = (limitUsage?.items ?? [])
    .filter((item: VariantLimitItem) => item.max > 0)
    .map((item: VariantLimitItem) =>
      item.id === "storage"
        ? { ...item, label: t("variant_encoded_size") }
        : item
    );
  const fallbackItems: VariantLimitItem[] =
    items.length > 0
      ? items
      : [
          {
            id: "storage",
            label: t("variant_encoded_size"),
            used: usedBytes,
            max: capacityBytes,
            section: "storage",
            format: "bytes",
          },
        ];

  const sections = buildPopoverSections(fallbackItems, t);

  return (
    <div className="variant-capacity-root" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="dialog"
        aria-label={t("variant_storage_aria", { percent })}
        className={`variant-capacity variant-capacity--${level}`}
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
        title={t("variant_show_limits")}
        type="button"
      >
        <div aria-hidden className="variant-capacity-track">
          <div
            className="variant-capacity-fill"
            style={{ width: `${fillPercent}%` }}
          />
        </div>
        <span className="variant-capacity-label">
          {formatVariantBytes(usedBytes)} / {formatVariantBytes(capacityBytes)}
          {over ? " +" : ""}
        </span>
      </button>
      {open
        ? createPortal(
            <div
              aria-label={t("variant_limits_aria")}
              className="variant-limits-popover"
              ref={panelRef}
              role="dialog"
              style={{
                bottom: panelPos.bottom,
                left: panelPos.left,
                width: PANEL_WIDTH,
                maxHeight: PANEL_MAX_HEIGHT,
              }}
            >
              <div className="variant-limits-popover-title">
                {t("variant_limits_title")}
              </div>
              <div className="variant-limits-body">
                {sections.map((section) => (
                  <section
                    className={`variant-limits-section${
                      section.kind === "variables"
                        ? " variant-limits-section--variables"
                        : ""
                    }`}
                    key={section.id}
                  >
                    <h3 className="variant-limits-section-title">
                      {section.title}
                    </h3>
                    <div
                      className={
                        section.kind === "variables"
                          ? "variant-limits-rows variant-limits-rows--compact"
                          : "variant-limits-rows"
                      }
                    >
                      {section.items.map((item) => (
                        <LimitRow item={item} key={item.id} />
                      ))}
                    </div>
                  </section>
                ))}
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
