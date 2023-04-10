import { Icon } from '@rsuite/icons'
import { Entity } from 'megalodon'
import { useTranslation } from 'react-i18next'
import { BsBag } from 'react-icons/bs'
import { FlexboxGrid, Avatar } from 'rsuite'
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
      <FlexboxGrid align="middle" style={{ paddingRight: '8px' }}>
        {/** icon **/}
        <FlexboxGrid.Item style={{ paddingRight: '8px', textAlign: 'right' }} colspan={4}>
          <Icon as={BsBag} color="cyan" />
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
              src={props.notification.target.avatar}
              onClick={() => props.setAccountDetail(props.notification.target)}
              title={props.notification.target.acct}
              alt={props.notification.target.acct}
            />
          </div>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={20} style={{ paddingRight: '8px' }}>
          <div>
            <span dangerouslySetInnerHTML={{ __html: emojify(props.notification.target.display_name, props.notification.target.emojis) }} />
          </div>
          <div style={{ color: 'var(--rs-text-secondary)' }}>{props.notification.target.acct}</div>
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </div>
  )
}

const actionText = (notification: Entity.Notification) => {
  const { t } = useTranslation()

  switch (notification.type) {
    case 'move':
      return (
        <span
          style={{ color: 'var(--rs-text-secondary)' }}
          dangerouslySetInnerHTML={{
            __html: emojify(t('timeline.notification.move.body', { user: notification.account.display_name }), notification.account.emojis)
          }}
        />
      )
    default:
      return null
  }
}
