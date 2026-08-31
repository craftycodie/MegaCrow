import type { MegaloVersionId } from "@megacrow/megalo";
import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import { getVersionInfo } from "../compile";
import { useT } from "../localization";
import { usePopoverPosition } from "../ui/usePopoverPosition";
import type { StoredWorkspace, Workspace } from "../workspace";
import { DOCS_PATHS, DocsHelpButton } from "./DocsHelpButton";

const PANEL_WIDTH = 380;

interface Props {
  onAddWorkspace: () => void;
  onDeleteWorkspace: (id: string) => void;
  onEditWorkspace: (workspace: StoredWorkspace) => void;
  onSelectWorkspace: (id: string) => void;
  workspace: Workspace | null;
  workspaces: StoredWorkspace[];
}

/** Reach is the only supported game/version today. */
function gameIconSrc(_version: MegaloVersionId): string {
  return `${import.meta.env.BASE_URL}img/icons/game-reach.png`;
}

function WorkspaceVersionLabel({
  name,
  megaloVersion,
}: {
  name: string;
  megaloVersion: MegaloVersionId;
}) {
  const version = getVersionInfo(megaloVersion);
  return (
    <>
      <span className="workspace-menu-name">{name}</span>
      <span className="workspace-menu-version-group">
        <img
          alt=""
          className="workspace-menu-game-icon"
          src={gameIconSrc(megaloVersion)}
          title={version.label}
        />
        <span className="workspace-menu-version">{version.label}</span>
      </span>
    </>
  );
}

function EditIcon() {
  return (
    <svg aria-hidden="true" height="14" viewBox="0 0 16 16" width="14">
      <path
        d="M11.13 2.37a1.25 1.25 0 0 1 1.77 0l.73.73a1.25 1.25 0 0 1 0 1.77L6.2 12.27 3 13l.73-3.2z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
    </svg>
  );
}

function DeleteIcon() {
  return (
    <svg aria-hidden="true" height="14" viewBox="0 0 16 16" width="14">
      <path
        d="M3.5 4.5h9M6 4.5V3.25h4V4.5M5.25 4.5l.6 8.25h4.3l.6-8.25"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.25"
      />
    </svg>
  );
}

export function WorkspaceMenu({
  workspace,
  workspaces,
  onSelectWorkspace,
  onAddWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
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
        title={workspace?.inputPath ?? t("workspace_select_title")}
        type="button"
      >
        <span className="workspace-menu-label">
          {workspace ? (
            <WorkspaceVersionLabel
              megaloVersion={workspace.megaloVersion}
              name={workspace.name}
            />
          ) : (
            t("workspace_no_workspace")
          )}
        </span>
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
              aria-label={t("workspace_aria_label")}
              className="workspace-menu-panel"
              ref={panelRef}
              role="menu"
              style={{
                top: panelPos.top,
                left: panelPos.left,
                width: PANEL_WIDTH,
              }}
            >
              {workspaces.length === 0 ? (
                <>
                  <div className="workspace-menu-title-row">
                    <p className="workspace-menu-title">
                      {t("workspace_title")}
                    </p>
                    <DocsHelpButton
                      label={t("docs_open_workspaces")}
                      path={DOCS_PATHS.workspaces}
                    />
                  </div>
                  <p className="workspace-menu-empty">
                    {t("workspace_none_configured")}
                  </p>
                </>
              ) : (
                <div className="workspace-menu-table">
                  <div className="workspace-menu-columns">
                    <span className="workspace-menu-columns-label">
                      <span>{t("workspace_title")}</span>
                      <DocsHelpButton
                        label={t("docs_open_workspaces")}
                        path={DOCS_PATHS.workspaces}
                      />
                    </span>
                    <span
                      aria-hidden="true"
                      className="workspace-menu-columns-actions"
                    >
                      {t("workspace_actions")}
                    </span>
                  </div>
                  <ul className="workspace-menu-list">
                    {workspaces.map((entry) => {
                      const active = workspace?.id === entry.id;
                      const version = getVersionInfo(entry.megaloVersion);
                      return (
                        <li
                          className={`workspace-menu-row${active ? " workspace-menu-row--active" : ""}`}
                          key={entry.id}
                        >
                          <button
                            aria-checked={active}
                            className={`workspace-menu-item${active ? " workspace-menu-item--active" : ""}`}
                            onClick={() => {
                              setOpen(false);
                              onSelectWorkspace(entry.id);
                            }}
                            role="menuitemradio"
                            title={entry.inputPath}
                            type="button"
                          >
                            {active ? (
                              <span className="workspace-menu-item-active-label">
                                {t("workspace_active")}
                              </span>
                            ) : null}
                            <span className="workspace-menu-item-title">
                              <span className="workspace-menu-item-name">
                                {entry.name}
                              </span>
                              <span className="workspace-menu-item-version">
                                <img
                                  alt=""
                                  className="workspace-menu-game-icon"
                                  src={gameIconSrc(entry.megaloVersion)}
                                />
                                <span>{version.label}</span>
                              </span>
                            </span>
                            <span className="workspace-menu-item-path">
                              {entry.inputPath}
                            </span>
                          </button>
                          <div className="workspace-menu-item-actions">
                            <button
                              aria-label={t("workspace_edit_named", {
                                name: entry.name,
                              })}
                              className="workspace-menu-item-action"
                              onClick={() => {
                                setOpen(false);
                                onEditWorkspace(entry);
                              }}
                              title={t("workspace_edit_named", {
                                name: entry.name,
                              })}
                              type="button"
                            >
                              <EditIcon />
                            </button>
                            <button
                              aria-label={t("workspace_delete_named", {
                                name: entry.name,
                              })}
                              className="workspace-menu-item-action workspace-menu-item-action--danger"
                              onClick={() => {
                                setOpen(false);
                                onDeleteWorkspace(entry.id);
                              }}
                              title={t("workspace_delete_named", {
                                name: entry.name,
                              })}
                              type="button"
                            >
                              <DeleteIcon />
                            </button>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                </div>
              )}
              <button
                className="workspace-menu-add"
                onClick={() => {
                  setOpen(false);
                  onAddWorkspace();
                }}
                role="menuitem"
                type="button"
              >
                {t("workspace_add")}
              </button>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
