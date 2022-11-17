use std::sync::Arc;

use megalodon::{self, streaming::Message};
use serde::Serialize;
use tauri::{AppHandle, Manager};

use crate::entities;

#[derive(Clone, Serialize)]
pub struct ReceiveHomeStatusPayload {
    server_id: i64,
    status: megalodon::entities::Status,
}

#[derive(Clone, Serialize)]
pub struct ReceiveNotificationPayload {
    server_id: i64,
    notification: megalodon::entities::Notification,
}

pub async fn start(
    app_handle: Arc<AppHandle>,
    server: &entities::Server,
    account: &entities::Account,
    timeline: &str,
) -> Result<(), String> {
    let url = format!("https://{}", server.domain);
    let sns = megalodon::detector(url.as_str())
        .await
        .map_err(|e| e.to_string())?;
    let client = megalodon::generator(
        sns,
        url,
        Some(account.access_token.clone()),
        Some(String::from("fedistar")),
    );
    let instance = client.get_instance().await.map_err(|e| e.to_string())?;
    let streaming_url = instance.json.urls.streaming_api;

    let streaming: Box<dyn megalodon::Streaming>;
    match timeline {
        "user" => {
            streaming = client.user_streaming(streaming_url);
        }
        "public" => {
            streaming = client.public_streaming(streaming_url);
        }
        "local" => {
            streaming = client.local_streaming(streaming_url);
        }
        "direct" => {
            streaming = client.local_streaming(streaming_url);
        }
        other => return Err(format!("{} is not supported streaming", other)),
    }

    log::info!(
        "{} streaming is started for {}@{}",
        timeline,
        account.username,
        server.domain
    );

    let server_id = server.id;

    streaming.listen(Box::new(move |message| match message {
        Message::Update(mes) => {
            log::debug!("receive update");
            app_handle
                .emit_all(
                    "receive-home-status",
                    ReceiveHomeStatusPayload {
                        server_id,
                        status: mes,
                    },
                )
                .unwrap();
        }
        Message::Notification(mes) => {
            log::debug!("receive notification");
            app_handle
                .emit_all(
                    "receive-notification",
                    ReceiveNotificationPayload {
                        server_id,
                        notification: mes,
                    },
                )
                .unwrap();
        }
        _ => {}
    }));

    Ok(())
}
