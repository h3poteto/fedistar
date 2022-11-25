import { Entity } from 'megalodon'
import { Avatar, FlexboxGrid } from 'rsuite'
import { BsPersonPlus } from 'react-icons/bs'
import { Icon } from '@rsuite/icons'
import Time from 'src/components/utils/Time'
import emojify from 'src/utils/emojify'

type Props = {
  notification: Entity.Notification
}

const actionText = (notification: Entity.Notification) => {
  switch (notification.type) {
    case 'follow':
      return (
        <span
          style={{ color: 'var(--rs-text-secondary)' }}
          dangerouslySetInnerHTML={{ __html: emojify(`${notification.account.display_name} followed you`, notification.account.emojis) }}
        />
      )
    case 'follow_request':
      return (
        <span
          style={{ color: 'var(--rs-text-secondary)' }}
          dangerouslySetInnerHTML={{
            __html: emojify(`${notification.account.display_name} requested to follow you`, notification.account.emojis)
          }}
        />
      )
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
          <Icon as={BsPersonPlus} color="cyan" />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={14} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {actionText(props.notification)}
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={6} style={{ textAlign: 'right', color: 'var(--rs-text-tertiary)' }}>
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
          <div>
            <span
              dangerouslySetInnerHTML={{ __html: emojify(props.notification.account.display_name, props.notification.account.emojis) }}
            />
          </div>
          <div style={{ color: 'var(--rs-text-secondary)' }}>{props.notification.account.acct}</div>
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </div>
  )
}

export default Follow
