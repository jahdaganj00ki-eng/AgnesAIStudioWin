use std::fs;
use std::path::PathBuf;

use crate::models::{AppSettings, Conversation};

fn get_app_dir() -> PathBuf {
    let base = dirs::config_dir().unwrap_or_else(|| PathBuf::from("."));
    base.join("com.agnes-ai.studio")
}

fn ensure_app_dir() -> std::io::Result<PathBuf> {
    let dir = get_app_dir();
    fs::create_dir_all(&dir)?;
    Ok(dir)
}

fn conversations_dir() -> PathBuf {
    get_app_dir().join("conversations")
}

// API Key
pub fn save_api_key(key: &str) -> Result<(), String> {
    let dir = ensure_app_dir().map_err(|e| e.to_string())?;
    let path = dir.join("api_key.json");
    let data = serde_json::json!({ "api_key": key });
    fs::write(&path, serde_json::to_string_pretty(&data).unwrap())
        .map_err(|e| e.to_string())
}

pub fn load_api_key() -> Result<String, String> {
    let path = get_app_dir().join("api_key.json");
    if !path.exists() {
        return Ok(String::new());
    }
    let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let json: serde_json::Value =
        serde_json::from_str(&data).map_err(|e| e.to_string())?;
    Ok(json["api_key"]
        .as_str()
        .unwrap_or("")
        .to_string())
}

// Settings
fn default_settings() -> AppSettings {
    AppSettings {
        system_prompt: "Du bist ein hilfreicher, präziser KI-Assistent.".to_string(),
        temperature: 0.7,
        last_model: "agnes-2.0-flash".to_string(),
        active_conversation_id: None,
    }
}

pub fn save_settings(settings: &AppSettings) -> Result<(), String> {
    let dir = ensure_app_dir().map_err(|e| e.to_string())?;
    let path = dir.join("settings.json");
    let data = serde_json::to_string_pretty(settings).map_err(|e| e.to_string())?;
    fs::write(&path, data).map_err(|e| e.to_string())
}

pub fn load_settings() -> Result<AppSettings, String> {
    let path = get_app_dir().join("settings.json");
    if !path.exists() {
        let defaults = default_settings();
        save_settings(&defaults)?;
        return Ok(defaults);
    }
    let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
    let settings: AppSettings =
        serde_json::from_str(&data).map_err(|e| e.to_string())?;
    Ok(settings)
}

// Conversations
pub fn save_conversation(conv: &Conversation) -> Result<(), String> {
    let _dir = fs::create_dir_all(conversations_dir()).map_err(|e| e.to_string())?;
    let path = conversations_dir().join(format!("{}.json", conv.id));
    let data = serde_json::to_string_pretty(conv).map_err(|e| e.to_string())?;
    fs::write(&path, data).map_err(|e| e.to_string())
}

pub fn load_conversations() -> Result<Vec<Conversation>, String> {
    let dir = conversations_dir();
    if !dir.exists() {
        return Ok(Vec::new());
    }
    let mut convs = Vec::new();
    let entries = fs::read_dir(&dir).map_err(|e| e.to_string())?;
    for entry in entries {
        let entry = entry.map_err(|e| e.to_string())?;
        let path = entry.path();
        if path.extension().and_then(|s| s.to_str()) == Some("json") {
            let data = fs::read_to_string(&path).map_err(|e| e.to_string())?;
            if let Ok(conv) = serde_json::from_str::<Conversation>(&data) {
                convs.push(conv);
            }
        }
    }
    convs.sort_by(|a, b| b.created_at.cmp(&a.created_at));
    Ok(convs)
}

pub fn delete_conversation(id: &str) -> Result<(), String> {
    let path = conversations_dir().join(format!("{}.json", id));
    if path.exists() {
        fs::remove_file(&path).map_err(|e| e.to_string())?;
    }
    Ok(())
}

pub fn delete_all_conversations() -> Result<(), String> {
    let dir = conversations_dir();
    if dir.exists() {
        fs::remove_dir_all(&dir).map_err(|e| e.to_string())?;
    }
    Ok(())
}
