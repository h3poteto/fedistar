import { Entity } from 'megalodon'

export type ReceiveNotificationPayload = {
  server_id: number
  notification: Entity.Notification
}

export type ReceiveHomeStatusPayload = {
  server_id: number
  status: Entity.Status
}

export type ReceiveHomeStatusUpdatePayload = {
  server_id: number
  status: Entity.Status
}

export type DeleteHomeStatusPayload = {
  server_id: number
  status_id: string
}

export type ReceiveTimelineStatusPayload = {
  timeline_id: number
  status: Entity.Status
}

export type ReceiveTimelineStatusUpdatePayload = {
  timeline_id: number
  status: Entity.Status
}

export type DeleteTimelineStatusPayload = {
  timeline_id: number
  status_id: string
}

export type ReceiveTimelineConversationPayload = {
  timeline_id: number
  conversation: Entity.Conversation
}
