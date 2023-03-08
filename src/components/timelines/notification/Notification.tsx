import { Entity, MegalodonInterface } from 'megalodon'
import Follow from './Follow'
import Reaction from './Reaction'
import Status from '../status/Status'
import { Server } from 'src/entities/server'
import { Account } from 'src/entities/account'

type Props = {
  notification: Entity.Notification
  client: MegalodonInterface
  server: Server
  account: Account | null
  updateStatus: (status: Entity.Status) => void
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
  setReplyOpened: (opened: boolean) => void
  setStatusDetail: (statusId: string, serverId: number, accountId?: number) => void
  setAccountDetail: (userId: string, serverId: number, accountId?: number) => void
  openReport: (status: Entity.Status, client: MegalodonInterface) => void
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
    case 'favourite':
    case 'reblog':
    case 'poll_expired':
    case 'poll_vote':
    case 'quote':
    case 'status':
    case 'emoji_reaction':
      return (
        <Reaction
          server={props.server}
          notification={props.notification}
          updateStatus={props.updateStatus}
          client={props.client}
          openMedia={props.openMedia}
          setAccountDetail={account => props.setAccountDetail(account.id, props.server.id, props.account?.id)}
        />
      )
    case 'mention':
      return (
        <Status
          client={props.client}
          status={props.notification.status}
          server={props.server}
          account={props.account}
          updateStatus={props.updateStatus}
          openMedia={props.openMedia}
          setReplyOpened={props.setReplyOpened}
          setStatusDetail={props.setStatusDetail}
          setAccountDetail={props.setAccountDetail}
          openReport={props.openReport}
        />
      )
    default:
      return null
  }
}

const Notification: React.FC<Props> = props => {
  return notification(props)
}

export default Notification
