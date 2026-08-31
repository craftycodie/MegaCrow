import type { MegaloVersionId } from "@megacrow/megalo";
import { useT } from "../../localization";
import type { StoredWorkspace, Workspace } from "../../workspace";
import { MegaloVersionMenu } from "../MegaloVersionMenu";
import { WorkspaceMenu } from "../WorkspaceMenu";

interface Props {
  onAddWorkspace?: () => void;
  onDeleteWorkspace?: (id: string) => void;
  onEditWorkspace?: (workspace: StoredWorkspace) => void;
  onSelectMegaloVersion?: (version: MegaloVersionId) => void;
  onSelectWorkspace?: (id: string) => void;
  workspace: Workspace | null;
  workspaceSwitcher?: boolean;
  workspaces?: StoredWorkspace[];
}

export function FilesPanelHeader({
  workspace,
  workspaces = [],
  onSelectWorkspace,
  onSelectMegaloVersion,
  onAddWorkspace,
  onEditWorkspace,
  onDeleteWorkspace,
  workspaceSwitcher = false,
}: Props) {
  const t = useT();

  return (
    <header className="files-panel-header">
      {workspaceSwitcher &&
      onSelectWorkspace &&
      onAddWorkspace &&
      onEditWorkspace &&
      onDeleteWorkspace ? (
        <WorkspaceMenu
          onAddWorkspace={onAddWorkspace}
          onDeleteWorkspace={onDeleteWorkspace}
          onEditWorkspace={onEditWorkspace}
          onSelectWorkspace={onSelectWorkspace}
          workspace={workspace}
          workspaces={workspaces}
        />
      ) : onSelectMegaloVersion && workspace ? (
        <MegaloVersionMenu
          megaloVersion={workspace.megaloVersion}
          onSelectVersion={onSelectMegaloVersion}
        />
      ) : (
        <div className="files-panel-heading">
          <h2 className="files-panel-title">
            {workspace ? workspace.name : t("files_explorer_title")}
          </h2>
        </div>
      )}
    </header>
  );
}
