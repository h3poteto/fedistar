import { Entity } from 'megalodon'
import { List } from 'rsuite'
import Follow from './Follow'
import Reaction from './Reaction'
import Status from '../status/Status'

type Props = {
  notification: Entity.Notification
}

const notification = (noti: Entity.Notification) => {
  switch (noti.type) {
    case 'follow':
    case 'follow_request':
      return <Follow notification={noti} />
    case 'favourite':
    case 'reblog':
    case 'poll_expired':
    case 'poll_vote':
    case 'quote':
    case 'status':
    case 'emoji_reaction':
      return <Reaction notification={noti} />
    case 'mention':
      return <Status status={noti.status} />
    default:
      return null
  }
}

const Notification: React.FC<Props> = props => {
  return <List.Item style={{ paddingTop: '2px', paddingBottom: '2px' }}>{notification(props.notification)}</List.Item>
}

export default Notification
