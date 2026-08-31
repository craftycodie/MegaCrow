use serde::{Deserialize, Serialize};
use std::fs;
use std::path::PathBuf;
use tauri::{AppHandle, Manager};

pub const SETTINGS_VERSION: u32 = 3;

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct StoredWorkspace {
  pub id: String,
  pub name: String,
  pub megalo_version: String,
  pub input_path: String,
  /// Empty / omitted when Build output is unused. Matches the TS `string | null`.
  #[serde(default)]
  pub output_path: Option<String>,
  #[serde(default)]
  pub last_open_file_path: Option<String>,
  #[serde(default)]
  pub game_launch_command: Option<String>,
  #[serde(default)]
  pub game_build_number: Option<i32>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[serde(rename_all = "camelCase")]
pub struct MegacrowSettings {
  pub version: u32,
  pub active_workspace_id: Option<String>,
  pub workspaces: Vec<StoredWorkspace>,
  pub discord_rich_presence: bool,
  /// Retained for older settings.json files; unused by the app.
  #[serde(default = "default_true")]
  pub mcc_hot_reload: bool,
  pub gamertag: String,
  pub compiler_strictness: bool,
  #[serde(default = "default_compiler_profile")]
  pub compiler_profile: String,
  #[serde(default = "default_editor_theme")]
  pub editor_theme: String,
  #[serde(default = "default_editor_word_wrap")]
  pub editor_word_wrap: bool,
  #[serde(default = "default_locale")]
  pub locale: String,
  #[serde(default)]
  pub skipped_update_version: Option<String>,
}

fn default_true() -> bool {
  true
}

fn default_compiler_profile() -> String {
  "megacrow".to_string()
}

fn default_editor_theme() -> String {
  "megacrow-dark".to_string()
}

fn default_editor_word_wrap() -> bool {
  true
}

fn default_locale() -> String {
  "en".to_string()
}

fn default_gamertag() -> String {
  "MegaloEvolved".to_string()
}

impl Default for MegacrowSettings {
  fn default() -> Self {
    Self {
      version: SETTINGS_VERSION,
      active_workspace_id: None,
      workspaces: Vec::new(),
      discord_rich_presence: true,
      mcc_hot_reload: true,
      gamertag: default_gamertag(),
      compiler_strictness: false,
      compiler_profile: default_compiler_profile(),
      editor_theme: default_editor_theme(),
      editor_word_wrap: default_editor_word_wrap(),
      locale: default_locale(),
      skipped_update_version: None,
    }
  }
}

fn settings_path(app: &AppHandle) -> Result<PathBuf, String> {
  let dir = app
    .path()
    .app_config_dir()
    .map_err(|error| error.to_string())?;
  Ok(dir.join("settings.json"))
}

pub fn load_settings(app: &AppHandle) -> Result<Option<MegacrowSettings>, String> {
  let path = settings_path(app)?;
  if !path.is_file() {
    return Ok(None);
  }
  let raw = fs::read_to_string(&path).map_err(|error| error.to_string())?;
  let settings: MegacrowSettings =
    serde_json::from_str(&raw).map_err(|error| error.to_string())?;
  Ok(Some(settings))
}

pub fn save_settings(app: &AppHandle, settings: &MegacrowSettings) -> Result<(), String> {
  let path = settings_path(app)?;
  if let Some(parent) = path.parent() {
    fs::create_dir_all(parent).map_err(|error| error.to_string())?;
  }
  let raw = serde_json::to_string_pretty(settings).map_err(|error| error.to_string())?;
  fs::write(&path, raw).map_err(|error| error.to_string())
}

#[cfg(test)]
mod tests {
  use super::*;

  #[test]
  fn deserializes_frontend_settings_payload() {
    let raw = r#"{
      "version": 3,
      "activeWorkspaceId": null,
      "workspaces": [],
      "discordRichPresence": true,
      "gamertag": "",
      "compilerStrictness": false,
      "compilerProfile": "megacrow",
      "editorTheme": "megacrow-dark",
      "skippedUpdateVersion": null
    }"#;
    let settings: MegacrowSettings = serde_json::from_str(raw).expect("deserialize");
    assert_eq!(settings.version, 3);
    assert!(settings.workspaces.is_empty());
    assert!(settings.editor_word_wrap);
    assert_eq!(settings.compiler_profile, "megacrow");
  }

  #[test]
  fn deserializes_legacy_mcc_hot_reload() {
    let raw = r#"{
      "version": 3,
      "activeWorkspaceId": null,
      "workspaces": [],
      "discordRichPresence": true,
      "mccHotReload": true,
      "gamertag": "",
      "compilerStrictness": false,
      "editorTheme": "megacrow-dark",
      "skippedUpdateVersion": null
    }"#;
    let settings: MegacrowSettings = serde_json::from_str(raw).expect("deserialize");
    assert_eq!(settings.compiler_profile, "megacrow");
    assert!(settings.mcc_hot_reload);
  }

  #[test]
  fn deserializes_workspace_last_open_file_path() {
    let raw = r#"{
      "version": 3,
      "activeWorkspaceId": "ws-1",
      "workspaces": [{
        "id": "ws-1",
        "name": "HREK",
        "megaloVersion": "107-mcc",
        "inputPath": "C:/HREK/data/multiplayer/megalo",
        "outputPath": "C:/HREK/maps/megalo",
        "lastOpenFilePath": "C:/HREK/data/multiplayer/megalo/foo.txt"
      }],
      "discordRichPresence": true,
      "gamertag": "",
      "compilerStrictness": false,
      "editorTheme": "megacrow-dark",
      "skippedUpdateVersion": null
    }"#;
    let settings: MegacrowSettings = serde_json::from_str(raw).expect("deserialize");
    assert_eq!(
      settings.workspaces[0].last_open_file_path.as_deref(),
      Some("C:/HREK/data/multiplayer/megalo/foo.txt")
    );
    assert_eq!(
      settings.workspaces[0].output_path.as_deref(),
      Some("C:/HREK/maps/megalo")
    );
  }

  #[test]
  fn workspace_optional_paths_default_missing() {
    let raw = r#"{
      "version": 3,
      "activeWorkspaceId": "ws-1",
      "workspaces": [{
        "id": "ws-1",
        "name": "HREK",
        "megaloVersion": "107-mcc",
        "inputPath": "C:/HREK/data/multiplayer/megalo"
      }],
      "discordRichPresence": true,
      "gamertag": "",
      "compilerStrictness": false,
      "editorTheme": "megacrow-dark",
      "skippedUpdateVersion": null
    }"#;
    let settings: MegacrowSettings = serde_json::from_str(raw).expect("deserialize");
    assert!(settings.workspaces[0].last_open_file_path.is_none());
    assert!(settings.workspaces[0].output_path.is_none());
  }

  #[test]
  fn deserializes_null_output_path() {
    let raw = r#"{
      "version": 3,
      "activeWorkspaceId": "ws-1",
      "workspaces": [{
        "id": "ws-1",
        "name": "Scripts",
        "megaloVersion": "107-mcc",
        "inputPath": "C:/scripts",
        "outputPath": null,
        "lastOpenFilePath": null
      }],
      "discordRichPresence": true,
      "gamertag": "",
      "compilerStrictness": false,
      "editorTheme": "megacrow-dark",
      "skippedUpdateVersion": null
    }"#;
    let settings: MegacrowSettings = serde_json::from_str(raw).expect("deserialize");
    assert!(settings.workspaces[0].output_path.is_none());
  }

  #[test]
  fn workspace_advanced_fields_default_missing() {
    let raw = r#"{
      "version": 3,
      "activeWorkspaceId": "ws-1",
      "workspaces": [{
        "id": "ws-1",
        "name": "HREK",
        "megaloVersion": "73",
        "inputPath": "C:/HREK/data/multiplayer/megalo"
      }],
      "discordRichPresence": true,
      "gamertag": "",
      "compilerStrictness": false,
      "editorTheme": "megacrow-dark",
      "skippedUpdateVersion": null
    }"#;
    let settings: MegacrowSettings = serde_json::from_str(raw).expect("deserialize");
    assert!(settings.workspaces[0].game_launch_command.is_none());
    assert!(settings.workspaces[0].game_build_number.is_none());
  }

  #[test]
  fn deserializes_workspace_advanced_fields() {
    let raw = r#"{
      "version": 3,
      "activeWorkspaceId": "ws-1",
      "workspaces": [{
        "id": "ws-1",
        "name": "Beta",
        "megaloVersion": "73",
        "inputPath": "C:/scripts",
        "outputPath": null,
        "lastOpenFilePath": null,
        "gameLaunchCommand": "xenia.exe halo3/default.xex",
        "gameBuildNumber": 9449
      }],
      "discordRichPresence": true,
      "gamertag": "",
      "compilerStrictness": false,
      "editorTheme": "megacrow-dark",
      "skippedUpdateVersion": null
    }"#;
    let settings: MegacrowSettings = serde_json::from_str(raw).expect("deserialize");
    assert_eq!(
      settings.workspaces[0].game_launch_command.as_deref(),
      Some("xenia.exe halo3/default.xex")
    );
    assert_eq!(settings.workspaces[0].game_build_number, Some(9449));
  }

  #[test]
  fn default_gamertag_is_megacrow() {
    assert_eq!(MegacrowSettings::default().gamertag, "MegaloEvolved");
  }
}
