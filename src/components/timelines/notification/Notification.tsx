import { Entity, MegalodonInterface } from 'megalodon'
import { List } from 'rsuite'
import Follow from './Follow'
import Reaction from './Reaction'
import Status from '../status/Status'
import { Server } from 'src/entities/server'

type Props = {
  notification: Entity.Notification
  client: MegalodonInterface
  server: Server
  updateStatus: (status: Entity.Status) => void
  openMedia: (media: Entity.Attachment) => void
  setReplyOpened: (opened: boolean) => void
}

const notification = (props: Props) => {
  switch (props.notification.type) {
    case 'follow':
    case 'follow_request':
      return <Follow notification={props.notification} />
    case 'favourite':
    case 'reblog':
    case 'poll_expired':
    case 'poll_vote':
    case 'quote':
    case 'status':
    case 'emoji_reaction':
      return <Reaction notification={props.notification} />
    case 'mention':
      return (
        <Status
          client={props.client}
          status={props.notification.status}
          server={props.server}
          updateStatus={props.updateStatus}
          openMedia={props.openMedia}
          setReplyOpened={props.setReplyOpened}
        />
      )
    default:
      return null
  }
}

const Notification: React.FC<Props> = props => {
  return <List.Item style={{ paddingTop: '2px', paddingBottom: '2px' }}>{notification(props)}</List.Item>
}

export default Notification
