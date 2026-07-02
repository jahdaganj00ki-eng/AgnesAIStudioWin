use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Message {
    pub role: String,
    pub content: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct Conversation {
    pub id: String,
    pub title: String,
    pub messages: Vec<Message>,
    pub created_at: String,
    pub system_prompt: String,
    pub temperature: f64,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct AppSettings {
    pub system_prompt: String,
    pub temperature: f64,
    pub last_model: String,
    pub active_conversation_id: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VideoStatus {
    pub video_id: String,
    pub status: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub video_url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub progress: Option<f64>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub error: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ChatRequest {
    pub model: String,
    pub messages: Vec<ChatMessage>,
    pub stream: bool,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub temperature: Option<f64>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ChatMessage {
    pub role: String,
    pub content: ContentPart,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
#[serde(untagged)]
pub enum ContentPart {
    Text(String),
    Parts(Vec<ContentItem>),
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ContentItem {
    #[serde(rename = "type")]
    pub item_type: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub text: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub image_url: Option<ImageUrl>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ImageUrl {
    pub url: String,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ImageRequest {
    pub model: String,
    pub prompt: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub size: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ImageResponse {
    pub data: Vec<ImageData>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ImageData {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub url: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub b64_json: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VideoRequest {
    pub model: String,
    pub prompt: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub height: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub width: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub num_frames: Option<u32>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub frame_rate: Option<u32>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct VideoCreateResponse {
    pub video_id: String,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub status: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ChatStreamChunk {
    pub choices: Vec<ChatStreamChoice>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ChatStreamChoice {
    pub delta: ChatStreamDelta,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub finish_reason: Option<String>,
}

#[derive(Serialize, Deserialize, Clone, Debug)]
pub struct ChatStreamDelta {
    #[serde(skip_serializing_if = "Option::is_none")]
    pub role: Option<String>,
    #[serde(skip_serializing_if = "Option::is_none")]
    pub content: Option<String>,
}
