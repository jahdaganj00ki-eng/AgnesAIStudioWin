use reqwest::Client;
use serde_json::Value;
use tauri::Emitter;
use tokio_stream::StreamExt;

use crate::models::*;

const API_BASE: &str = "https://apihub.agnes-ai.com/v1";
const VIDEO_POLL_BASE: &str = "https://apihub.agnes-ai.com";

pub fn build_client() -> Result<Client, String> {
    Client::builder()
        .timeout(std::time::Duration::from_secs(120))
        .build()
        .map_err(|e| e.to_string())
}

pub async fn stream_chat(
    api_key: &str,
    messages: &[Message],
    model: &str,
    temperature: f64,
    app: tauri::AppHandle,
) -> Result<(), String> {
    let client = build_client()?;

    let mut api_messages: Vec<ChatMessage> = Vec::new();
    for msg in messages {
        let content = if let Some(ref img) = msg.image_url {
            ContentPart::Parts(vec![
                ContentItem {
                    item_type: "text".to_string(),
                    text: Some(msg.content.clone()),
                    image_url: None,
                },
                ContentItem {
                    item_type: "image_url".to_string(),
                    text: None,
                    image_url: Some(ImageUrl { url: img.clone() }),
                },
            ])
        } else {
            ContentPart::Text(msg.content.clone())
        };
        api_messages.push(ChatMessage {
            role: msg.role.clone(),
            content,
        });
    }

    let request_body = ChatRequest {
        model: model.to_string(),
        messages: api_messages,
        stream: true,
        temperature: Some(temperature),
    };

    let response = client
        .post(format!("{}/chat/completions", API_BASE))
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Verbindungsfehler: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("API-Fehler {}: {}", status, body));
    }

    let mut stream = response.bytes_stream();
    let mut buffer = String::new();

    while let Some(chunk_result) = stream.next().await {
        let chunk = chunk_result.map_err(|e| format!("Stream-Fehler: {}", e))?;
        let text = String::from_utf8_lossy(&chunk);
        buffer.push_str(&text);

        while let Some(line_end) = buffer.find('\n') {
            let line = buffer[..line_end].trim().to_string();
            buffer = buffer[line_end + 1..].to_string();

            if line.is_empty() || line == "data: [DONE]" {
                if line == "data: [DONE]" {
                    let _ = app.emit("chat-stream-done", ());
                }
                continue;
            }

            if let Some(data) = line.strip_prefix("data: ") {
                if let Ok(chunk) = serde_json::from_str::<ChatStreamChunk>(data) {
                    if let Some(choice) = chunk.choices.first() {
                        if let Some(ref content) = choice.delta.content {
                            let _ = app.emit("chat-stream-chunk", content.clone());
                        }
                        if choice.finish_reason.is_some() {
                            let _ = app.emit("chat-stream-done", ());
                        }
                    }
                }
            }
        }
    }

    let _ = app.emit("chat-stream-done", ());
    Ok(())
}

pub async fn generate_image(
    api_key: &str,
    prompt: &str,
    model: &str,
    size: &str,
) -> Result<String, String> {
    let client = build_client()?;

    let request_body = ImageRequest {
        model: model.to_string(),
        prompt: prompt.to_string(),
        size: Some(size.to_string()),
    };

    let response = client
        .post(format!("{}/images/generations", API_BASE))
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Verbindungsfehler: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("API-Fehler {}: {}", status, body));
    }

    let result: ImageResponse = response
        .json()
        .await
        .map_err(|e| format!("Antwort-Fehler: {}", e))?;

    if let Some(img) = result.data.first() {
        if let Some(ref url) = img.url {
            return Ok(url.clone());
        }
        if let Some(ref b64) = img.b64_json {
            return Ok(format!("data:image/png;base64,{}", b64));
        }
    }

    Err("Kein Bild in der Antwort".to_string())
}

pub async fn create_video_task(
    api_key: &str,
    prompt: &str,
    height: u32,
    width: u32,
    num_frames: u32,
    frame_rate: u32,
) -> Result<String, String> {
    let client = build_client()?;

    let request_body = VideoRequest {
        model: "agnes-video-v2.0".to_string(),
        prompt: prompt.to_string(),
        height: Some(height),
        width: Some(width),
        num_frames: Some(num_frames),
        frame_rate: Some(frame_rate),
    };

    let response = client
        .post(format!("{}/videos", API_BASE))
        .header("Authorization", format!("Bearer {}", api_key))
        .header("Content-Type", "application/json")
        .json(&request_body)
        .send()
        .await
        .map_err(|e| format!("Verbindungsfehler: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("API-Fehler {}: {}", status, body));
    }

    let result: VideoCreateResponse = response
        .json()
        .await
        .map_err(|e| format!("Antwort-Fehler: {}", e))?;

    Ok(result.video_id)
}

pub async fn poll_video(api_key: &str, video_id: &str) -> Result<VideoStatus, String> {
    let client = build_client()?;

    let response = client
        .get(format!(
            "{}/agnesapi?video_id={}",
            VIDEO_POLL_BASE, video_id
        ))
        .header("Authorization", format!("Bearer {}", api_key))
        .send()
        .await
        .map_err(|e| format!("Verbindungsfehler: {}", e))?;

    if !response.status().is_success() {
        let status = response.status();
        let body = response.text().await.unwrap_or_default();
        return Err(format!("API-Fehler {}: {}", status, body));
    }

    let result: Value = response
        .json()
        .await
        .map_err(|e| format!("Antwort-Fehler: {}", e))?;

    Ok(VideoStatus {
        video_id: video_id.to_string(),
        status: result["status"]
            .as_str()
            .unwrap_or("unknown")
            .to_string(),
        video_url: result["video_url"]
            .as_str()
            .map(|s| s.to_string())
            .or_else(|| {
                result["url"]
                    .as_str()
                    .map(|s| s.to_string())
            }),
        progress: result["progress"].as_f64(),
        error: result["error"]
            .as_str()
            .map(|s| s.to_string()),
    })
}
