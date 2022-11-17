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

#[derive(Clone, Serialize)]
pub struct ReceiveTimelineStatusPayload {
    timeline_id: i64,
    status: megalodon::entities::Status,
}

pub async fn start_user(
    app_handle: Arc<AppHandle>,
    server: &entities::Server,
    account: &entities::Account,
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

    let streaming = client.user_streaming(streaming_url);

    log::info!(
        "user streaming is started for {}@{}",
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

pub async fn start(
    app_handle: Arc<AppHandle>,
    server: &entities::Server,
    timeline: &entities::Timeline,
    account: Option<entities::Account>,
) -> Result<(), String> {
    let url = format!("https://{}", server.domain);
    let sns = megalodon::detector(url.as_str())
        .await
        .map_err(|e| e.to_string())?;

    let client = megalodon::generator(
        sns,
        url,
        account.clone().and_then(|a| Some(a.access_token)),
        Some(String::from("fedistar")),
    );
    let instance = client.get_instance().await.map_err(|e| e.to_string())?;
    let streaming_url = instance.json.urls.streaming_api;

    let streaming: Box<dyn megalodon::Streaming>;
    match timeline.timeline.as_str() {
        "public" => {
            streaming = client.public_streaming(streaming_url);
        }
        "local" => {
            streaming = client.local_streaming(streaming_url);
        }
        other => return Err(format!("{} is not supported timeline", other)),
    }

    if let Some(account) = account {
        log::info!(
            "{} streaming is started for {}@{}",
            timeline.timeline,
            account.username,
            server.domain
        );
    } else {
        log::info!(
            "{} streaming is started for @{}",
            timeline.timeline,
            server.domain
        );
    }

    let timeline_id = timeline.id;

    streaming.listen(Box::new(move |message| match message {
        Message::Update(mes) => {
            log::debug!("receive update");
            app_handle
                .emit_all(
                    "receive-timeline-status",
                    ReceiveTimelineStatusPayload {
                        timeline_id,
                        status: mes,
                    },
                )
                .unwrap();
        }
        _ => {}
    }));

    Ok(())
}
