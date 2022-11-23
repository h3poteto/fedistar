import sanitizeHtml from 'sanitize-html'
import { Entity } from 'megalodon'

const generateNotification = (notification: Entity.Notification): [string, string] => {
  switch (notification.type) {
    case 'follow':
      return ['Follow', `${notification.account.acct} followed you`]
    case 'follow_request':
      return ['Follow Request', `${notification.account.acct} requested to follow you`]
    case 'favourite':
      return ['Favourite', `${notification.account.acct} favourited your post`]
    case 'reblog':
      return ['Reblog', `${notification.account.acct} reblogged your post`]
    case 'poll_expired':
      return ['Poll', `${notification.account.acct}'s poll is expired`]
    case 'poll':
      return ['Poll', `${notification.account.acct} voted your poll`]
    case 'quote':
      return ['Quote', `${notification.account.acct} quoted your post`]
    case 'status':
      return ['Status', `${notification.account.acct} just post`]
    case 'emoji_reaction':
      return ['Reaction', `${notification.account.acct} reacted your post`]
    case 'mention':
      return [
        `${notification.account.acct}`,
        sanitizeHtml(notification.status!.content, {
          allowedTags: [],
          allowedAttributes: []
        })
      ]
    default:
      return ['', '']
  }
}

export default generateNotification
