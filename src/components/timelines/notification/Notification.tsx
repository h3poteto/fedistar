import { Entity, MegalodonInterface } from 'megalodon'
import Follow from './Follow'
import Reaction from './Reaction'
import Status from '../status/Status'
import { Server } from 'src/entities/server'
import { Account } from 'src/entities/account'
import Move from './Move'
import { ColumnWidth } from 'src/entities/timeline'
import { CustomEmojiCategory } from 'src/entities/emoji'

type Props = {
  notification: Entity.Notification
  client: MegalodonInterface
  server: Server
  account: Account | null
  columnWidth: ColumnWidth
  updateStatus: (status: Entity.Status) => void
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
  setReplyOpened: (opened: boolean) => void
  setStatusDetail: (statusId: string, serverId: number, accountId?: number) => void
  setAccountDetail: (userId: string, serverId: number, accountId?: number) => void
  setTagDetail: (tag: string, serverId: number, accountId?: number) => void
  openReport: (status: Entity.Status, client: MegalodonInterface) => void
  openFromOtherAccount: (status: Entity.Status) => void
  customEmojis: Array<CustomEmojiCategory>
  filters: Array<Entity.Filter>
}

const notification = (props: Props) => {
  switch (props.notification.type) {
    case 'follow':
    case 'follow_request':
      return (
        <Follow
          notification={props.notification}
          setAccountDetail={account => props.setAccountDetail(account.id, props.server.id, props.account?.id)}
        />
      )
    case 'move':
      return (
        <Move
          notification={props.notification}
          setAccountDetail={account => props.setAccountDetail(account.id, props.server.id, props.account?.id)}
        />
      )
    case 'favourite':
    case 'reblog':
    case 'poll_expired':
    case 'poll_vote':
    case 'quote':
    case 'status':
    case 'update':
    case 'emoji_reaction':
    case 'reaction':
      if (props.notification.status) {
        return (
          <Reaction
            server={props.server}
            account={props.account}
            notification={props.notification}
            updateStatus={props.updateStatus}
            client={props.client}
            openMedia={props.openMedia}
            setTagDetail={(tag, serverId) => props.setTagDetail(tag, serverId, props.account?.id)}
            setAccountDetail={account => props.setAccountDetail(account.id, props.server.id, props.account?.id)}
            setStatusDetail={props.setStatusDetail}
          />
        )
      } else {
        return null
      }
    case 'mention':
      if (props.notification.status) {
        return (
          <Status
            client={props.client}
            status={props.notification.status}
            server={props.server}
            account={props.account}
            columnWidth={props.columnWidth}
            updateStatus={props.updateStatus}
            openMedia={props.openMedia}
            setReplyOpened={props.setReplyOpened}
            setStatusDetail={props.setStatusDetail}
            setAccountDetail={props.setAccountDetail}
            setTagDetail={props.setTagDetail}
            openReport={props.openReport}
            openFromOtherAccount={props.openFromOtherAccount}
            customEmojis={props.customEmojis}
            filters={props.filters}
          />
        )
      } else {
        return null
      }
    default:
      return null
  }
}

const Notification: React.FC<Props> = props => {
  return notification(props)
}

export default Notification
