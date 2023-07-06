import { Entity } from 'megalodon'
import { Avatar, FlexboxGrid } from 'rsuite'
import { BsPersonPlus } from 'react-icons/bs'
import { Icon } from '@rsuite/icons'
import Time from 'src/components/utils/Time'
import emojify from 'src/utils/emojify'
import { useIntl } from 'react-intl'

type Props = {
  notification: Entity.Notification
  setAccountDetail: (account: Entity.Account) => void
}

const actionText = (notification: Entity.Notification) => {
  const { formatMessage } = useIntl()

  switch (notification.type) {
    case 'follow':
      return (
        <span
          style={{ color: 'var(--rs-text-secondary)' }}
          dangerouslySetInnerHTML={{
            __html: emojify(
              formatMessage({ id: 'timeline.notification.follow.body' }, { user: notification.account.display_name }),
              notification.account.emojis
            )
          }}
        />
      )
    case 'follow_request':
      return (
        <span
          style={{ color: 'var(--rs-text-secondary)' }}
          dangerouslySetInnerHTML={{
            __html: emojify(
              formatMessage({ id: 'timeline.notification.follow_request.body' }, { user: notification.account.display_name }),
              notification.account.emojis
            )
          }}
        />
      )
    default:
      return null
  }
}

const Follow: React.FC<Props> = props => {
  return (
    <div onClick={() => props.setAccountDetail(props.notification.account)} style={{ cursor: 'pointer' }}>
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
            <Avatar
              src={props.notification.account.avatar}
              onClick={() => props.setAccountDetail(props.notification.account)}
              title={props.notification.account.acct}
              alt={props.notification.account.acct}
            />
          </div>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={20} style={{ paddingRight: '8px', overflowWrap: 'break-word' }}>
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
