import { Entity } from 'megalodon'
import { Avatar, FlexboxGrid } from 'rsuite'
import { Icon } from '@rsuite/icons'
import { BsStar, BsArrowRepeat, BsMenuUp, BsHouseDoor } from 'react-icons/bs'
import Time from 'src/components/utils/Time'

type Props = {
  notification: Entity.Notification
}

const actionIcon = (notificationType: string) => {
  switch (notificationType) {
    case 'favourite':
      return <Icon as={BsStar} />
    case 'reblog':
    case 'quote':
      return <Icon as={BsArrowRepeat} />
    case 'poll_expired':
    case 'poll_vote':
      return <Icon as={BsMenuUp} />
    case 'status':
      return <Icon as={BsHouseDoor} />
    case 'emoji_reaction':
      {
        /** TODO **/
      }
      return null
    default:
      return null
  }
}

const actionText = (notification: Entity.Notification) => {
  switch (notification.type) {
    case 'favourite':
      return <span>{notification.account.display_name} favourited your post</span>
    case 'reblog':
      return <span>{notification.account.display_name} reblogged your post</span>
    case 'poll_expired':
      return <span>{notification.account.display_name}&apos;s poll is expired</span>
    case 'poll_vote':
      return <span>{notification.account.display_name} voted your poll</span>
    case 'quote':
      return <span>{notification.account.display_name} quoted your post</span>
    case 'status':
      return <span>{notification.account.display_name} just posted</span>
    case 'emoji_reaction':
      return <span>{notification.account.display_name} reacted your post</span>
    default:
      return null
  }
}

const Reaction: React.FC<Props> = props => {
  const status = props.notification.status

  return (
    <div>
      {/** action **/}
      <FlexboxGrid style={{ paddingRight: '8px' }}>
        {/** icon **/}
        <FlexboxGrid.Item style={{ paddingRight: '8px', textAlign: 'right' }} colspan={4}>
          {actionIcon(props.notification.type)}
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
        {/** icon **/}
        <FlexboxGrid.Item colspan={4}>
          <div style={{ margin: '6px' }}>
            <Avatar src={status.account.avatar} />
          </div>
        </FlexboxGrid.Item>
        {/** status **/}
        <FlexboxGrid.Item colspan={20} style={{ paddingRight: '8px' }}>
          <div className="metadata">
            <FlexboxGrid>
              {/** account name **/}
              <FlexboxGrid.Item colspan={18} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {status.account.display_name}@{status.account.acct}
              </FlexboxGrid.Item>
              {/** timestamp **/}
              <FlexboxGrid.Item colspan={6} style={{ textAlign: 'right' }}>
                <Time time={status.created_at} />
              </FlexboxGrid.Item>
            </FlexboxGrid>
          </div>
          <div className="body" style={{ wordWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: status.content }}></div>
          <div className="toolbox"></div>
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </div>
  )
}

export default Reaction
