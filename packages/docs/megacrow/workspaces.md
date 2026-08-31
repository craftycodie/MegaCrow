# Workspaces

A **workspace** points MegaloEvolved at a Halo Reach Editing Kit (HREK) Megalo scripts folder so the Files sidebar can browse, open, and compile your `.txt` gametypes.

Workspaces are available in the **desktop (Tauri)** app. Open the switcher from the Files panel header.

## Workspace list

| Control | What it does |
|---------|----------------|
| **Select a row** | Makes that workspace active and loads its scripts folder in the Files tree |
| **Active** badge | Marks the workspace currently in use |
| **Edit** | Opens the workspace dialog to change name, scripts folder, or output folder |
| **Delete** | Removes the workspace from MegaloEvolved (does not delete files on disk) |
| **Add workspace…** | Creates a new workspace |

Each row also shows the Megalo version for that workspace (currently **107 MCC — Halo Reach**) and the scripts folder path.

## Add / edit workspace fields

| Field | Required | Description |
|-------|----------|-------------|
| **Name** | Yes | Display name in the workspace switcher. When you pick a scripts folder, MegaloEvolved may fill this from HREK `project.xml` if the name is still empty. |
| **Megalo version** | Fixed | Reach MCC (`107`). Other games/versions are not selectable yet. |
| **Scripts folder** | Yes | Root folder for Megalo source (typically `…\data\multiplayer\megalo`). Includes, relative paths, and the Files tree are resolved from here. |
| **Output folder** | No | Where compiled `.mglo` files are written for **Build**. Typically `…\maps\megalo`. If omitted, browsing and editing still work, but Build needs an output path. |

### Path guessing

When you browse for a scripts folder, MegaloEvolved tries to:

1. Read the HREK `project.xml` display name for the workspace name
2. Detect a sibling `maps\megalo` output folder if it already exists

You can always override either field.

## Tips

- Point scripts at the HREK Megalo data tree, not a single file.
- Set an output folder if you want one-click Build into `maps/megalo` for in-game hot reload.
- You can keep multiple workspaces (for example separate mods) and switch between them without re-picking folders.
