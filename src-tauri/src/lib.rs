mod api;
mod commands;
mod config;
mod models;

use tauri::Manager;

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_store::Builder::new().build())
        .setup(|app| {
            let _window = app.get_webview_window("main").unwrap();
            Ok(())
        })
        .invoke_handler(tauri::generate_handler![
            commands::chat_send_streaming,
            commands::image_generate,
            commands::video_create,
            commands::video_poll,
            commands::save_conversation,
            commands::load_conversations,
            commands::delete_conversation,
            commands::delete_all_conversations,
            commands::save_settings,
            commands::load_settings,
            commands::save_api_key,
            commands::load_api_key,
        ])
        .run(tauri::generate_context!())
        .expect("Fehler beim Starten der Anwendung");
}
