use discord_rich_presence::{activity, DiscordIpc, DiscordIpcClient};
use serde_json::Value;
use std::sync::{Arc, Mutex};
use std::thread;
use std::time::Duration;

/// Discord application ID for MegaloEvolved rich presence.
pub const APPLICATION_ID: &str = "1517107797437841589";

/// Discord application public key (Social SDK / verification; not used by IPC rich presence).
pub const APPLICATION_PUBLIC_KEY: &str =
  "dbd9c94e21cfce0755547a50f46e5d984eae2e8d56dd9817977b76a10dd5fe02";

#[derive(Clone)]
struct RpcPresence {
  details: String,
  state: String,
  enabled: bool,
  /// Discord display name / username from the IPC READY payload.
  username: Option<String>,
}

impl Default for RpcPresence {
  fn default() -> Self {
    Self {
      details: "MegaloEvolved".into(),
      state: "Editing Halo Reach gametypes".into(),
      enabled: true,
      username: None,
    }
  }
}

pub struct DiscordRpc {
  state: Arc<Mutex<RpcPresence>>,
}

impl DiscordRpc {
  pub fn new() -> Self {
    let state = Arc::new(Mutex::new(RpcPresence::default()));
    let thread_state = Arc::clone(&state);
    thread::spawn(move || run_discord_loop(thread_state));
    Self { state }
  }

  pub fn update(&self, details: Option<String>, presence_state: Option<String>) {
    let Ok(mut guard) = self.state.lock() else {
      return;
    };
    if let Some(details) = details {
      guard.details = details;
    }
    if let Some(presence_state) = presence_state {
      guard.state = presence_state;
    }
  }

  pub fn set_enabled(&self, enabled: bool) {
    let Ok(mut guard) = self.state.lock() else {
      return;
    };
    guard.enabled = enabled;
  }

  pub fn username(&self) -> Option<String> {
    self
      .state
      .lock()
      .ok()
      .and_then(|guard| guard.username.clone())
  }
}

fn set_username(state: &Arc<Mutex<RpcPresence>>, username: Option<String>) {
  if let Ok(mut guard) = state.lock() {
    guard.username = username;
  }
}

fn parse_ready_username(payload: &Value) -> Option<String> {
  let user = payload.get("data")?.get("user")?;
  let global_name = user
    .get("global_name")
    .and_then(Value::as_str)
    .map(str::trim)
    .filter(|value| !value.is_empty());
  let username = user
    .get("username")
    .and_then(Value::as_str)
    .map(str::trim)
    .filter(|value| !value.is_empty());
  global_name.or(username).map(str::to_string)
}

/// Handshake like `DiscordIpc::connect`, but keep the READY user for the watermark.
fn connect_and_read_user(client: &mut DiscordIpcClient) -> Result<Option<String>, String> {
  client
    .connect_ipc()
    .map_err(|error| error.to_string())?;
  client
    .send(
      serde_json::json!({
        "v": 1,
        "client_id": APPLICATION_ID,
      }),
      0,
    )
    .map_err(|error| error.to_string())?;
  let (_opcode, payload) = client.recv().map_err(|error| error.to_string())?;
  Ok(parse_ready_username(&payload))
}

fn run_discord_loop(state: Arc<Mutex<RpcPresence>>) {
  loop {
    let mut client = DiscordIpcClient::new(APPLICATION_ID);

    match connect_and_read_user(&mut client) {
      Ok(username) => {
        set_username(&state, username.clone());
        if let Some(name) = username {
          log::info!("Discord RPC connected as {name}");
        } else {
          log::info!("Discord RPC connected (no username in READY)");
        }
      }
      Err(error) => {
        set_username(&state, None);
        log::debug!("Discord RPC: waiting for Discord ({error})");
        thread::sleep(Duration::from_secs(30));
        continue;
      }
    }

    loop {
      let snapshot = state
        .lock()
        .map(|guard| guard.clone())
        .unwrap_or_default();

      if !snapshot.enabled {
        let _ = client.clear_activity();
        thread::sleep(Duration::from_secs(15));
        continue;
      }

      let payload = activity::Activity::new()
        .details(&snapshot.details)
        .state(&snapshot.state);

      if let Err(error) = client.set_activity(payload) {
        set_username(&state, None);
        log::debug!("Discord RPC: reconnecting ({error})");
        break;
      }

      thread::sleep(Duration::from_secs(15));
    }
  }
}
