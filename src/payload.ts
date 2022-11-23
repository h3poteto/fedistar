import { Entity } from 'megalodon'

export type ReceiveNotificationPayload = {
  server_id: number
  notification: Entity.Notification
}

export type ReceiveHomeStatusPayload = {
  server_id: number
  status: Entity.Status
}

export type ReceiveTimelineStatusPayload = {
  timeline_id: number
  status: Entity.Status
}
