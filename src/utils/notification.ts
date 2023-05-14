import sanitizeHtml from 'sanitize-html'
import { Entity } from 'megalodon'
import { TFunction } from 'i18next'

const generateNotification = (
  notification: Entity.Notification,
  t: TFunction<'translation', undefined, 'translation'>
): [string, string] => {
  switch (notification.type) {
    case 'follow':
      return [t('timeline.notification.follow.title'), t('timeline.notification.follow.body', { user: notification.account.acct })]
    case 'move':
      return [t('timeline.notification.move.title'), t('timeline.notification.move.body', { user: notification.account.acct })]
    case 'follow_request':
      return [
        t('timeline.notification.follow_request.title'),
        t('timeline.notification.follow_requested.body', { user: notification.account.acct })
      ]
    case 'favourite':
      return [t('timeline.notification.favourite.title'), t('timeline.notification.favourite.body', { user: notification.account.acct })]
    case 'reblog':
      return [t('timeline.notification.reblog.title'), t('timeline.notification.reblog.body', { user: notification.account.acct })]
    case 'poll_expired':
      return [
        t('timeline.notification.poll_expired.title'),
        t('timeline.notification.poll_expired.body', { user: notification.account.acct })
      ]
    case 'poll_vote':
      return [t('timeline.notification.poll_vote.title'), t('timeline.notification.poll_vote.body', { user: notification.account.acct })]
    case 'quote':
      return [t('timeline.notification.quote.title'), t('timeline.notification.quote.body', { user: notification.account.acct })]
    case 'status':
      return [t('timeline.notification.status.title'), t('timeline.notification.status.body', { user: notification.account.acct })]
    case 'update':
      return [t('timeline.notification.update.title'), t('timeline.notification.update.body', { user: notification.account.acct })]
    case 'emoji_reaction':
      return [
        t('timeline.notification.emoji_reaction.title'),
        t('timeline.notification.emoji_reaction.body', { user: notification.account.acct })
      ]
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
