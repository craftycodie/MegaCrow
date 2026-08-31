import {
  getGameName,
  getShortDescription,
  MEGALO_VERSIONS,
  type MegaloVersionId,
} from "@megacrow/megalo";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { useT } from "../localization";
import { usePopoverPosition } from "../ui/usePopoverPosition";

const PANEL_WIDTH = 340;

/** All engine profiles from `@megacrow/megalo` (newest first). */
export const BROWSER_MEGALO_VERSIONS: readonly MegaloVersionId[] = Object.keys(
  MEGALO_VERSIONS
) as MegaloVersionId[];

interface Props {
  megaloVersion: MegaloVersionId;
  onSelectVersion: (version: MegaloVersionId) => void;
  versions?: readonly MegaloVersionId[];
}

function gameIconSrc(_version: MegaloVersionId): string {
  return `${import.meta.env.BASE_URL}img/icons/game-reach.png`;
}

function VersionSummary({
  id,
  layout,
}: {
  id: MegaloVersionId;
  layout: "trigger" | "item";
}) {
  const info = MEGALO_VERSIONS[id];
  const gameName = getGameName(info);
  const short = getShortDescription(info);
  if (layout === "trigger") {
    return (
      <span className="workspace-menu-label megalo-version-summary">
        <span className="megalo-version-code">{id}</span>
        <span className="megalo-version-meta">
          <img
            alt=""
            className="workspace-menu-game-icon"
            src={gameIconSrc(id)}
            title={`${gameName} — ${short}`}
          />
          <span className="megalo-version-game">{gameName}</span>
          <span className="megalo-version-short">{short}</span>
        </span>
      </span>
    );
  }
  return (
    <span className="workspace-menu-item-title megalo-version-item">
      <span className="megalo-version-code">{id}</span>
      <span className="megalo-version-meta">
        <img
          alt=""
          className="workspace-menu-game-icon"
          src={gameIconSrc(id)}
        />
        <span className="megalo-version-game">{gameName}</span>
        <span className="megalo-version-short">{short}</span>
      </span>
    </span>
  );
}

export function MegaloVersionMenu({
  megaloVersion,
  onSelectVersion,
  versions = BROWSER_MEGALO_VERSIONS,
}: Props) {
  const t = useT();
  const [open, setOpen] = useState(false);
  const { panelPos, panelRef, rootRef, triggerRef, updatePanelPosition } =
    usePopoverPosition(open, { panelWidth: PANEL_WIDTH });

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

  return (
    <div className="workspace-menu" ref={rootRef}>
      <button
        aria-expanded={open}
        aria-haspopup="menu"
        className="workspace-menu-trigger"
        onClick={() => setOpen((value) => !value)}
        ref={triggerRef}
        title={t("megalo_version_select_title")}
        type="button"
      >
        <VersionSummary id={megaloVersion} layout="trigger" />
        <svg
          aria-hidden="true"
          className="workspace-menu-chevron"
          viewBox="0 0 12 12"
        >
          <path
            d="M3 4.5 6 8l3-3.5"
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
              aria-label={t("megalo_version_aria_label")}
              className="workspace-menu-panel"
              ref={panelRef}
              role="menu"
              style={{
                top: panelPos.top,
                left: panelPos.left,
                width: PANEL_WIDTH,
              }}
            >
              <div className="workspace-menu-table">
                <div className="workspace-menu-columns">
                  <span className="workspace-menu-columns-label">
                    <span>{t("megalo_version_title")}</span>
                  </span>
                </div>
                <ul className="workspace-menu-list">
                  {versions.map((id) => {
                    const selected = megaloVersion === id;
                    return (
                      <li
                        className={`workspace-menu-row${selected ? " workspace-menu-row--active" : ""}`}
                        key={id}
                      >
                        <button
                          className={`workspace-menu-item${selected ? " workspace-menu-item--active" : ""}`}
                          onClick={() => {
                            onSelectVersion(id);
                            setOpen(false);
                          }}
                          role="menuitem"
                          type="button"
                        >
                          {selected ? (
                            <span className="workspace-menu-item-active-label">
                              {t("workspace_active")}
                            </span>
                          ) : null}
                          <VersionSummary id={id} layout="item" />
                        </button>
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
