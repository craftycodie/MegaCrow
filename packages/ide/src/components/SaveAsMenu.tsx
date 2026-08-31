import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import type { GametypeSaveFormat } from "../gametype";
import { type IdeMessageKey, useT } from "../localization";
import { usePopoverPosition } from "../ui/usePopoverPosition";
import { DOCS_PATHS, DocsHelpButton } from "./DocsHelpButton";

interface SaveOption {
  descriptionKey: IdeMessageKey;
  format: GametypeSaveFormat;
  label: string;
  labelKey?: IdeMessageKey;
}

const SAVE_OPTIONS: SaveOption[] = [
  {
    format: "mglo",
    label: ".mglo",
    descriptionKey: "export_mglo_desc",
  },
  {
    format: "gvar",
    label: "gvar",
    descriptionKey: "export_gvar_desc",
  },
  {
    format: "mpvr",
    label: "mpvr",
    descriptionKey: "export_mpvr_desc",
  },
  {
    format: "asq",
    label: "Autosave Queue",
    labelKey: "export_asq_label",
    descriptionKey: "export_asq_desc",
  },
];

const PANEL_WIDTH = 320;

interface Props {
  disabled?: boolean;
  onSave: (format: GametypeSaveFormat) => void;
}

export function SaveAsMenu({ disabled = false, onSave }: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const { panelPos, panelRef, rootRef, triggerRef, updatePanelPosition } =
    usePopoverPosition(open, { panelWidth: PANEL_WIDTH, alignRight: true });

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
  }, [open, updatePanelPosition]);

  const handleSave = (format: GametypeSaveFormat) => {
    setOpen(false);
    onSave(format);
  };

  return (
    <div className="save-as-menu" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="toolbar-btn save-as-menu-trigger"
        disabled={disabled}
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
        type="button"
      >
        {t("export_button")}
        <svg
          aria-hidden="true"
          className="save-as-menu-chevron"
          viewBox="0 0 16 16"
        >
          <path
            d="M4.5 6.2 8 9.7l3.5-3.5"
            fill="none"
            stroke="currentColor"
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth="1.4"
          />
        </svg>
      </button>

      {open
        ? createPortal(
            <div
              aria-label={t("export_format_aria")}
              className="save-as-menu-panel"
              ref={panelRef}
              role="menu"
              style={{
                top: panelPos.top,
                left: panelPos.left,
                width: Math.min(window.innerWidth - 24, PANEL_WIDTH),
              }}
            >
              <div className="save-as-menu-title-row">
                <p className="save-as-menu-title">{t("export_as")}</p>
                <DocsHelpButton
                  label={t("docs_open_export")}
                  path={DOCS_PATHS.export}
                />
              </div>
              {SAVE_OPTIONS.map((option) => (
                <button
                  className="save-as-menu-item"
                  key={option.format}
                  onClick={() => handleSave(option.format)}
                  role="menuitem"
                  type="button"
                >
                  <span className="save-as-menu-item-text">
                    <span className="save-as-menu-item-label">
                      {option.labelKey ? t(option.labelKey) : option.label}
                    </span>
                    <span className="save-as-menu-item-hint">
                      {t(option.descriptionKey)}
                    </span>
                  </span>
                </button>
              ))}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
