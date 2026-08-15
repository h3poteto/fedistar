import { Icon } from '@rsuite/icons'
import { Entity } from 'megalodon'
import { BsBag } from 'react-icons/bs'
import { useIntl } from 'react-intl'
import { Avatar, HStack } from 'rsuite'
import Time from 'src/components/utils/Time'
import emojify from 'src/utils/emojify'

type Props = {
  notification: Entity.Notification
  setAccountDetail: (account: Entity.Account) => void
}

export default function Move(props: Props) {
  return (
    <div onClick={() => props.setAccountDetail(props.notification.target)} style={{ cursor: 'pointer' }}>
      {/** action **/}
      <HStack style={{ paddingRight: '8px' }}>
        {/** icon **/}
        <div style={{ paddingRight: '4px', paddingLeft: '8px', width: '32px', boxSizing: 'border-box' }}>
          <Icon as={BsBag} color="cyan" />
        </div>
        <HStack.Item grow={1} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {actionText(props.notification)}
        </HStack.Item>
        <div style={{ whiteSpace: 'nowrap', color: 'var(--rs-text-tertiary)' }}>
          <Time time={props.notification.created_at} />
        </div>
      </HStack>
      {/** body **/}
      <div style={{ display: 'flex' }}>
        <div style={{ width: '56px' }}>
          <div style={{ margin: '6px' }}>
            <Avatar
              src={props.notification.target.avatar}
              onClick={() => props.setAccountDetail(props.notification.target)}
              title={props.notification.target.acct}
              alt={props.notification.target.acct}
            />
          </div>
        </div>
        <div style={{ paddingRight: '8px', overflowWrap: 'break-word' }}>
          <div>
            <span dangerouslySetInnerHTML={{ __html: emojify(props.notification.target.display_name, props.notification.target.emojis) }} />
          </div>
          <div style={{ color: 'var(--rs-text-secondary)' }}>{props.notification.target.acct}</div>
        </div>
      </div>
    </div>
  )
}

const actionText = (notification: Entity.Notification) => {
  const { formatMessage } = useIntl()

  switch (notification.type) {
    case 'move':
      return (
        <span
          style={{ color: 'var(--rs-text-secondary)' }}
          dangerouslySetInnerHTML={{
            __html: emojify(
              formatMessage({ id: 'timeline.notification.move.body' }, { user: notification.account.display_name }),
              notification.account.emojis
            )
          }}
        />
      )
    default:
      return null
  }
}
