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
pub struct DeleteHomeStatusPayload {
    server_id: i64,
    status_id: String,
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

#[derive(Clone, Serialize)]
pub struct DeleteTimelineStatusPayload {
    timeline_id: i64,
    status_id: String,
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
        Message::Delete(status_id) => {
            log::debug!("receive delete");
            app_handle
                .emit_all(
                    "delete-home-status",
                    DeleteHomeStatusPayload {
                        server_id,
                        status_id,
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
    match timeline.kind {
        entities::timeline::Kind::Public => {
            streaming = client.public_streaming(streaming_url);
        }
        entities::timeline::Kind::Local => {
            streaming = client.local_streaming(streaming_url);
        }
        entities::timeline::Kind::List => match &timeline.list_id {
            None => return Err(format!("could not find list_id for {} ", timeline.name)),
            Some(list_id) => {
                streaming = client.list_streaming(streaming_url, list_id.to_string());
            }
        },
        _ => return Err(format!("{} is not supported", timeline.name)),
    }

    if let Some(account) = account {
        log::info!(
            "{} streaming is started for {}@{}",
            timeline.name,
            account.username,
            server.domain
        );
    } else {
        log::info!(
            "{} streaming is started for @{}",
            timeline.name,
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
        Message::Delete(status_id) => {
            log::debug!("receive delete");
            app_handle
                .emit_all(
                    "delete-timeline-status",
                    DeleteTimelineStatusPayload {
                        timeline_id,
                        status_id,
                    },
                )
                .unwrap();
        }
        _ => {}
    }));

    Ok(())
}
