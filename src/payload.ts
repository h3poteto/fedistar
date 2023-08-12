import { Entity } from 'megalodon'
import { ThemeType } from './entities/settings'
import { localeType } from './i18n'

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

export type UpdatedSettingsPayload = {
  appearance: {
    font_size: number
    language: localeType
    color_theme: ThemeType
  }
}
