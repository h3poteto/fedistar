import { MouseEventHandler } from 'react'
import { Entity, MegalodonInterface } from 'megalodon'
import { Avatar, Button, FlexboxGrid, toaster, Notification } from 'rsuite'
import { Icon } from '@rsuite/icons'
import { BsStar, BsArrowRepeat, BsMenuUp, BsHouseDoor, BsPaperclip } from 'react-icons/bs'
import { open } from '@tauri-apps/api/shell'

import Time from 'src/components/utils/Time'
import emojify from 'src/utils/emojify'
import { findLink, findAccount, accountMatch, ParsedAccount } from 'src/utils/statusParser'
import Body from '../status/Body'
import Poll from '../status/Poll'
import { useTranslation } from 'react-i18next'
import { Server } from 'src/entities/server'

type Props = {
  server: Server
  notification: Entity.Notification
  client: MegalodonInterface
  updateStatus: (status: Entity.Status) => void
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
  setAccountDetail: (account: Entity.Account) => void
}

const actionIcon = (notification: Entity.Notification) => {
  switch (notification.type) {
    case 'favourite':
      return <Icon as={BsStar} color="orange" />
    case 'reblog':
    case 'quote':
      return <Icon as={BsArrowRepeat} color="green" />
    case 'poll_expired':
    case 'poll_vote':
      return <Icon as={BsMenuUp} />
    case 'status':
      return <Icon as={BsHouseDoor} />
    case 'emoji_reaction':
      return <span dangerouslySetInnerHTML={{ __html: notification.emoji }} />
    default:
      return null
  }
}

const actionText = (notification: Entity.Notification, setAccountDetail: (account: Entity.Account) => void) => {
  const { t } = useTranslation()

  switch (notification.type) {
    case 'favourite':
      return (
        <span
          style={{ color: 'var(--rs-text-secondary)', cursor: 'pointer' }}
          dangerouslySetInnerHTML={{
            __html: emojify(
              t('timeline.notification.favourite.body', { user: notification.account.display_name }),
              notification.account.emojis
            )
          }}
          onClick={() => setAccountDetail(notification.account)}
        />
      )
    case 'reblog':
      return (
        <span
          style={{ color: 'var(--rs-text-secondary)', cursor: 'pointer' }}
          dangerouslySetInnerHTML={{
            __html: emojify(
              t('timeline.notification.reblog.body', { user: notification.account.display_name }),
              notification.account.emojis
            )
          }}
          onClick={() => setAccountDetail(notification.account)}
        />
      )
    case 'poll_expired':
      return (
        <span
          style={{ color: 'var(--rs-text-secondary)', cursor: 'pointer' }}
          dangerouslySetInnerHTML={{
            __html: emojify(
              t('timeline.notification.poll_expired.body', { user: notification.account.display_name }),
              notification.account.emojis
            )
          }}
          onClick={() => setAccountDetail(notification.account)}
        />
      )
    case 'poll_vote':
      return (
        <span
          style={{ color: 'var(--rs-text-secondary)', cursor: 'pointer' }}
          dangerouslySetInnerHTML={{
            __html: emojify(
              t('timeline.notification.poll_vote.body', { user: notification.account.display_name }),
              notification.account.emojis
            )
          }}
          onClick={() => setAccountDetail(notification.account)}
        />
      )
    case 'quote':
      return (
        <span
          style={{ color: 'var(--rs-text-secondary)', cursor: 'pointer' }}
          dangerouslySetInnerHTML={{
            __html: emojify(t('timeline.notification.quote.body', { user: notification.account.display_name }), notification.account.emojis)
          }}
          onClick={() => setAccountDetail(notification.account)}
        />
      )
    case 'status':
      return (
        <span
          style={{ color: 'var(--rs-text-secondary)', cursor: 'pointer' }}
          dangerouslySetInnerHTML={{
            __html: emojify(
              t('timeline.notification.status.body', { user: notification.account.display_name }),
              notification.account.emojis
            )
          }}
          onClick={() => setAccountDetail(notification.account)}
        />
      )
    case 'emoji_reaction':
      return (
        <span
          style={{ color: 'var(--rs-text-secondary)', cursor: 'pointer' }}
          dangerouslySetInnerHTML={{
            __html: emojify(
              t('timeline.notification.emoji_reaction.body', { user: notification.account.display_name }),
              notification.account.emojis
            )
          }}
          onClick={() => setAccountDetail(notification.account)}
        />
      )
    default:
      return null
  }
}

const Reaction: React.FC<Props> = props => {
  const { t } = useTranslation()
  const status = props.notification.status

  const refresh = async () => {
    const res = await props.client.getStatus(status.id)
    props.updateStatus(res.data)
  }

  const statusClicked: MouseEventHandler<HTMLDivElement> = async e => {
    // Check username
    const parsedAccount = findAccount(e.target as HTMLElement, 'status-body')
    if (parsedAccount) {
      e.preventDefault()

      const account = await searchAccount(parsedAccount, status, props.client, props.server)
      if (account) {
        props.setAccountDetail(account)
      } else {
        let confirmToaster: any
        /*  eslint prefer-const: 0 */
        confirmToaster = toaster.push(
          notification(
            'info',
            t('dialog.account_not_found.title'),
            t('dialog.account_not_found.message'),
            t('dialog.account_not_found.button'),
            () => {
              open(parsedAccount.url)
              toaster.remove(confirmToaster)
            }
          ),
          { placement: 'topCenter', duration: 0 }
        )
      }
      return
    }

    // Check link
    const url = findLink(e.target as HTMLElement, 'status-body')
    if (url) {
      open(url)
      e.preventDefault()
    }
  }

  return (
    <div>
      {/** action **/}
      <FlexboxGrid style={{ paddingRight: '8px' }}>
        {/** icon **/}
        <FlexboxGrid.Item style={{ paddingRight: '8px', textAlign: 'right' }} colspan={4}>
          {actionIcon(props.notification)}
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={14} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
          {actionText(props.notification, props.setAccountDetail)}
        </FlexboxGrid.Item>
        <FlexboxGrid.Item colspan={6} style={{ textAlign: 'right', color: 'var(--rs-text-secondary)' }}>
          <Time time={props.notification.created_at} />
        </FlexboxGrid.Item>
      </FlexboxGrid>
      {/** body **/}
      <FlexboxGrid style={{ color: 'var(--rs-text-tertiary)' }}>
        {/** icon **/}
        <FlexboxGrid.Item colspan={4}>
          <div style={{ margin: '6px' }}>
            <Avatar
              src={status.account.avatar}
              onClick={() => props.setAccountDetail(status.account)}
              style={{ cursor: 'pointer' }}
              title={status.account.acct}
              alt={status.account.acct}
            />
          </div>
        </FlexboxGrid.Item>
        {/** status **/}
        <FlexboxGrid.Item colspan={20} style={{ paddingRight: '8px' }}>
          <div className="metadata">
            <FlexboxGrid>
              {/** account name **/}
              <FlexboxGrid.Item colspan={18} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                <span dangerouslySetInnerHTML={{ __html: emojify(status.account.display_name, status.account.emojis) }} />
                <span>@{status.account.acct}</span>
              </FlexboxGrid.Item>
              {/** timestamp **/}
              <FlexboxGrid.Item colspan={6} style={{ textAlign: 'right' }}>
                <Time time={status.created_at} />
              </FlexboxGrid.Item>
            </FlexboxGrid>
          </div>
          <Body status={status} onClick={statusClicked} />
          {status.poll && <Poll poll={status.poll} client={props.client} pollUpdated={refresh} />}
          {status.media_attachments.map((media, index) => (
            <div key={index}>
              <Button appearance="subtle" size="sm" onClick={() => props.openMedia(status.media_attachments, index)}>
                <Icon as={BsPaperclip} />
                {media.id}
              </Button>
            </div>
          ))}
          <div className="toolbox"></div>
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </div>
  )
}

async function searchAccount(account: ParsedAccount, status: Entity.Status, client: MegalodonInterface, server: Server) {
  if (status.in_reply_to_account_id) {
    const res = await client.getAccount(status.in_reply_to_account_id)
    if (res.status === 200) {
      const user = accountMatch([res.data], account, server.domain)
      if (user) return user
    }
  }
  if (status.in_reply_to_id) {
    const res = await client.getStatusContext(status.id)
    if (res.status === 200) {
      const accounts: Array<Entity.Account> = res.data.ancestors.map(s => s.account).concat(res.data.descendants.map(s => s.account))
      const user = accountMatch(accounts, account, server.domain)
      if (user) return user
    }
  }
  const res = await client.searchAccount(account.url, { resolve: true })
  if (res.data.length === 0) return null
  const user = accountMatch(res.data, account, server.domain)
  if (user) return user
  return null
}

function notification(
  type: 'info' | 'success' | 'warning' | 'error',
  title: string,
  message: string,
  button: string,
  callback: () => void
) {
  return (
    <Notification type={type} header={title} closable>
      <p>{message}</p>
      <Button onClick={callback}>{button}</Button>
    </Notification>
  )
}

export default Reaction
