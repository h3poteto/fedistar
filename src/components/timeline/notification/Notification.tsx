import { Entity } from 'megalodon'
import { List } from 'rsuite'
import Follow from './Follow'
import Favourite from './Favourite'

type Props = {
  notification: Entity.Notification
}

const notification = (noti: Entity.Notification) => {
  switch (noti.type) {
    case 'follow':
      return <Follow notification={noti} />
    case 'favourite':
      return <Favourite notification={noti} />
    default:
      return <div>{noti.id}</div>
  }
}

const Notification: React.FC<Props> = props => {
  return <List.Item style={{ paddingTop: '2px', paddingBottom: '2px' }}>{notification(props.notification)}</List.Item>
}

export default Notification
