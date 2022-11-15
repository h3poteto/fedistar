import { Entity } from 'megalodon'
import { Avatar, FlexboxGrid } from 'rsuite'
import { BsPersonPlus } from 'react-icons/bs'
import { Icon } from '@rsuite/icons'
import Time from 'src/components/utils/Time'

type Props = {
  notification: Entity.Notification
}

const actionText = (notification: Entity.Notification) => {
  switch (notification.type) {
    case 'follow':
      return <span> {notification.account.display_name} followed you</span>
    case 'follow_request':
      return <span>{notification.account.display_name} requested to follow you</span>
    default:
      return null
  }
}

const Follow: React.FC<Props> = props => {
  return (
    <div>
      {/** action **/}
      <FlexboxGrid align="middle" style={{ paddingRight: '8px' }}>
        {/** icon **/}
        <FlexboxGrid.Item style={{ paddingRight: '8px', textAlign: 'right' }} colspan={4}>
          <Icon as={BsPersonPlus} />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={14} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {actionText(props.notification)}
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={6} style={{ textAlign: 'right' }}>
          <Time time={props.notification.created_at} />
        </FlexboxGrid.Item>
      </FlexboxGrid>
      {/** body **/}
      <FlexboxGrid>
        <FlexboxGrid.Item colspan={4}>
          <div style={{ margin: '6px' }}>
            <Avatar src={props.notification.account.avatar} />
          </div>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={20} style={{ paddingRight: '8px' }}>
          <div>{props.notification.account.display_name}</div>
          <div>{props.notification.account.acct}</div>
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </div>
  )
}

export default Follow
