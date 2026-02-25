use megalodon::{self, streaming::Message};
use serde::Serialize;
use tauri::{AppHandle, Emitter};

use crate::entities;

#[derive(Clone, Serialize)]
pub struct ReceiveHomeStatusPayload {
    server_id: i64,
    status: megalodon::entities::Status,
}

#[derive(Clone, Serialize)]
pub struct ReceiveHomeStatusUpdatePayload {
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
    server_id: i64,
    timeline_id: i64,
    name: String,
    status: megalodon::entities::Status,
}

#[derive(Clone, Serialize)]
pub struct ReceiveTimelineStatusUpdatePayload {
    server_id: i64,
    timeline_id: i64,
    name: String,
    status: megalodon::entities::Status,
}

#[derive(Clone, Serialize)]
pub struct DeleteTimelineStatusPayload {
    server_id: i64,
    timeline_id: i64,
    name: String,
    status_id: String,
}

#[derive(Clone, Serialize)]
pub struct ReceiveTimelineConversationPayload {
    server_id: i64,
    timeline_id: i64,
    conversation: megalodon::entities::Conversation,
}

pub async fn start_user(
    app_handle: AppHandle,
    server: &entities::Server,
    account: &entities::Account,
) -> Result<(), String> {
    let mut retry_count = 0;

    let url = format!("https://{}", server.domain);
    let sns = megalodon::detector(url.as_str())
        .await
        .map_err(|e| e.to_string())?;
    let client = megalodon::generator(
        sns,
        url,
        Some(account.access_token.clone()),
        Some(String::from("fedistar")),
    )
    .map_err(|err| err.to_string())?;

    let streaming = client.user_streaming().await;
    if !streaming.is_supported() {
        tracing::info!(
            "Streaming is not supported for {}@{}",
            account.username,
            server.domain
        );
        return Ok(());
    }

    loop {
        tracing::info!(
            "user streaming is started for {}@{}",
            account.username,
            server.domain
        );

        let server_id = server.id;
        let app_handle = app_handle.clone();

        let s = streaming.listen(Box::new(move |message| {
            let app_handle = app_handle.clone();
            Box::pin(async move {
                match message {
                    Message::Update(mes) => {
                        tracing::debug!("receive update");
                        app_handle
                            .emit(
                                "receive-home-status",
                                ReceiveHomeStatusPayload {
                                    server_id,
                                    status: mes,
                                },
                            )
                            .expect("Failed to send receive-home-status event");
                    }
                    Message::Notification(mes) => {
                        tracing::debug!("receive notification");
                        if mes.account.is_some() {
                            app_handle
                                .emit(
                                    "receive-notification",
                                    ReceiveNotificationPayload {
                                        server_id,
                                        notification: mes,
                                    },
                                )
                                .expect("Failed to send receive-notification event");
                        }
                    }
                    Message::StatusUpdate(mes) => {
                        tracing::debug!("receive status updated");
                        app_handle
                            .emit(
                                "receive-home-status-update",
                                ReceiveHomeStatusUpdatePayload {
                                    server_id,
                                    status: mes,
                                },
                            )
                            .expect("Failed to send receive-home-status-update event");
                    }
                    Message::Delete(status_id) => {
                        tracing::debug!("receive delete");
                        app_handle
                            .emit(
                                "delete-home-status",
                                DeleteHomeStatusPayload {
                                    server_id,
                                    status_id,
                                },
                            )
                            .expect("Failed to send delete-home-status event");
                    }
                    _ => {}
                }
            })
        }));
        s.await;

        tracing::info!(
            "User streaming {}@{} is finished, retrying...",
            account.username,
            server.domain
        );

        retry_count += 1;
        let delay = std::cmp::min(retry_count * retry_count, 60);
        tokio::time::sleep(std::time::Duration::from_secs(delay)).await;
    }
}

pub async fn start(
    app_handle: AppHandle,
    server: &entities::Server,
    timeline: &entities::Timeline,
    account: Option<entities::Account>,
) -> Result<(), String> {
    let mut retry_count = 0;
    let streaming_message;
    if let Some(ref account) = account {
        streaming_message = format!(
            "{} streaming of {}@{}",
            timeline.name.as_str(),
            account.username.as_str(),
            server.domain.as_str()
        );
    } else {
        streaming_message = format!(
            "{} streaming of @{}",
            timeline.name.as_str(),
            server.domain.as_str()
        );
    }

    let url = format!("https://{}", server.domain);
    let sns = megalodon::detector(url.as_str())
        .await
        .map_err(|e| e.to_string())?;

    let client = megalodon::generator(
        sns,
        url,
        account.clone().and_then(|a| Some(a.access_token)),
        Some(String::from("fedistar")),
    )
    .map_err(|err| err.to_string())?;

    let streaming: Box<dyn megalodon::Streaming + Send + Sync>;
    match timeline.kind {
        entities::timeline::Kind::Public => {
            streaming = client.public_streaming().await;
        }
        entities::timeline::Kind::Local => {
            streaming = client.local_streaming().await;
        }
        entities::timeline::Kind::Direct => {
            streaming = client.direct_streaming().await;
        }
        entities::timeline::Kind::List => match &timeline.list_id {
            None => return Err(format!("could not find list_id for {} ", timeline.name)),
            Some(list_id) => {
                streaming = client.list_streaming(list_id.to_string()).await;
            }
        },
        entities::timeline::Kind::Tag => {
            streaming = client.tag_streaming(timeline.name.clone()).await;
        }
        _ => return Err(format!("{} is not supported", timeline.name)),
    }

    if !streaming.is_supported() {
        tracing::info!("Streaming is not supported for {}", timeline.name);
        return Ok(());
    }

    loop {
        tracing::info!("{} is started", streaming_message);

        let timeline_id = timeline.id;
        let server_id = server.id;
        let name = timeline.name.clone();
        let app_handle = app_handle.clone();

        let s = streaming.listen(Box::new(move |message| {
            let app_handle = app_handle.clone();
            let name = name.clone();
            Box::pin(async move {
                match message {
                    Message::Update(mes) => {
                        tracing::debug!("receive update");
                        app_handle
                            .emit(
                                "receive-timeline-status",
                                ReceiveTimelineStatusPayload {
                                    server_id,
                                    timeline_id,
                                    name: name.clone(),
                                    status: mes,
                                },
                            )
                            .expect("Failed to receive-timeline-status event");
                    }
                    Message::StatusUpdate(mes) => {
                        tracing::debug!("receive status update");
                        app_handle
                            .emit(
                                "receive-timeline-status-update",
                                ReceiveTimelineStatusUpdatePayload {
                                    server_id,
                                    timeline_id,
                                    name: name.clone(),
                                    status: mes,
                                },
                            )
                            .expect("Failed to receive-timeline-status-update event");
                    }
                    Message::Delete(status_id) => {
                        tracing::debug!("receive delete");
                        app_handle
                            .emit(
                                "delete-timeline-status",
                                DeleteTimelineStatusPayload {
                                    server_id,
                                    timeline_id,
                                    name: name.clone(),
                                    status_id,
                                },
                            )
                            .expect("Failed to delete-timeline-status event");
                    }
                    Message::Conversation(conversation) => {
                        tracing::debug!("receive conversation");
                        app_handle
                            .emit(
                                "receive-timeline-conversation",
                                ReceiveTimelineConversationPayload {
                                    server_id,
                                    timeline_id,
                                    conversation,
                                },
                            )
                            .expect("Failed to receive-timeline-conversation event");
                    }
                    _ => {}
                }
            })
        }));
        s.await;

        tracing::info!("{} is finished, so retrying...", streaming_message);

        retry_count += 1;
        let delay = std::cmp::min(retry_count * retry_count, 60);
        tokio::time::sleep(std::time::Duration::from_secs(delay)).await;
    }
}
