use tauri::AppHandle;

use crate::api;
use crate::config;
use crate::models::*;

// Chat
#[tauri::command]
pub async fn chat_send_streaming(
    app: AppHandle,
    api_key: String,
    messages: Vec<Message>,
    model: String,
    system_prompt: String,
    temperature: f64,
) -> Result<(), String> {
    let mut all_messages = Vec::new();

    if !system_prompt.is_empty() {
        all_messages.push(Message {
            role: "system".to_string(),
            content: system_prompt,
            image_url: None,
        });
    }

    all_messages.extend(messages);

    api::stream_chat(&api_key, &all_messages, &model, temperature, app).await
}

// Image
#[tauri::command]
pub async fn image_generate(
    api_key: String,
    prompt: String,
    model: String,
    size: String,
) -> Result<String, String> {
    api::generate_image(&api_key, &prompt, &model, &size).await
}

// Video
#[tauri::command]
pub async fn video_create(
    api_key: String,
    prompt: String,
    height: u32,
    width: u32,
    num_frames: u32,
    frame_rate: u32,
) -> Result<String, String> {
    api::create_video_task(&api_key, &prompt, height, width, num_frames, frame_rate).await
}

#[tauri::command]
pub async fn video_poll(api_key: String, video_id: String) -> Result<VideoStatus, String> {
    api::poll_video(&api_key, &video_id).await
}

// Conversations
#[tauri::command]
pub fn save_conversation(conversation: Conversation) -> Result<(), String> {
    config::save_conversation(&conversation)
}

#[tauri::command]
pub fn load_conversations() -> Result<Vec<Conversation>, String> {
    config::load_conversations()
}

#[tauri::command]
pub fn delete_conversation(id: String) -> Result<(), String> {
    config::delete_conversation(&id)
}

#[tauri::command]
pub fn delete_all_conversations() -> Result<(), String> {
    config::delete_all_conversations()
}

// Settings
#[tauri::command]
pub fn save_settings(settings: AppSettings) -> Result<(), String> {
    config::save_settings(&settings)
}

#[tauri::command]
pub fn load_settings() -> Result<AppSettings, String> {
    config::load_settings()
}

// API Key
#[tauri::command]
pub fn save_api_key(key: String) -> Result<(), String> {
    config::save_api_key(&key)
}

#[tauri::command]
pub fn load_api_key() -> Result<String, String> {
    config::load_api_key()
}
