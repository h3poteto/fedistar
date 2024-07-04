import { HTMLAttributes, MouseEventHandler, useEffect, useState } from 'react'
import { Entity, MegalodonInterface } from 'megalodon'
import { FlexboxGrid, Avatar, Button, useToaster, Notification } from 'rsuite'
import { Icon } from '@rsuite/icons'
import { BsArrowRepeat, BsPin } from 'react-icons/bs'
import { open } from '@tauri-apps/api/shell'
import Time from 'src/components/utils/Time'
import emojify from 'src/utils/emojify'
import Attachments from './Attachments'
import { accountMatch, findAccount, findLink, findTag, ParsedAccount } from 'src/utils/statusParser'
import Reply from 'src/components/compose/Status'
import { Account } from 'src/entities/account'
import { Server } from 'src/entities/server'
import Body from './Body'
import Actions from './Actions'
import Poll from './Poll'
import { FormattedMessage, useIntl } from 'react-intl'
import { ColumnWidth } from 'src/entities/timeline'
import { CustomEmojiCategory } from 'src/entities/emoji'

type Props = {
  status: Entity.Status
  client: MegalodonInterface
  server: Server
  account: Account | null
  pinned?: boolean
  columnWidth: ColumnWidth
  updateStatus: (status: Entity.Status) => void
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
  setReplyOpened?: (opened: boolean) => void
  setStatusDetail?: (statusId: string, serverId: number, accountId?: number) => void
  setAccountDetail: (userId: string, serverId: number, accountId?: number) => void
  setTagDetail: (tag: string, serverId: number, accountId?: number) => void
  openReport: (status: Entity.Status, client: MegalodonInterface) => void
  openFromOtherAccount: (status: Entity.Status) => void
  customEmojis: Array<CustomEmojiCategory>
  filters?: Array<Entity.Filter>
  locale: string
} & HTMLAttributes<HTMLElement>

const Status: React.FC<Props> = props => {
  const status = originalStatus(props.status)

  const { formatMessage } = useIntl()
  const { client } = props
  const [showReply, setShowReply] = useState<boolean>(false)
  const [showEdit, setShowEdit] = useState<boolean>(false)
  const [spoilered, setSpoilered] = useState<boolean>(status.spoiler_text.length > 0)
  const [ignoreFilter, setIgnoreFilter] = useState<boolean>(false)

  const toaster = useToaster()

  useEffect(() => {
    if (props.setReplyOpened) {
      if (showReply) {
        props.setReplyOpened(showReply)
        setShowEdit(false)
      } else if (showEdit) {
        props.setReplyOpened(showEdit)
        setShowReply(false)
      } else {
        props.setReplyOpened(false)
      }
    }
  }, [showReply, showEdit])

  const statusClicked: MouseEventHandler<HTMLDivElement> = async e => {
    // Check username
    const parsedAccount = findAccount(e.target as HTMLElement, 'status-body')
    if (parsedAccount) {
      e.preventDefault()
      e.stopPropagation()

      const account = await searchAccount(parsedAccount, props.status, props.client, props.server)
      if (account) {
        props.setAccountDetail(account.id, props.server.id, props.account?.id)
      } else {
        let confirmToaster: any
        /*  eslint prefer-const: 0 */
        confirmToaster = toaster.push(
          notification(
            'info',
            formatMessage({ id: 'dialog.account_not_found.title' }),
            formatMessage({ id: 'dialog.account_not_found.message' }),
            formatMessage({ id: 'dialog.account_not_found.button' }),
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

    // Check hashtag
    const parsedTag = findTag(e.target as HTMLElement, 'status-body')
    if (parsedTag) {
      e.preventDefault()
      e.stopPropagation()
      props.setTagDetail(parsedTag, props.server.id, props.account?.id)
      return
    }

    // Check link
    const url = findLink(e.target as HTMLElement, 'status-body')
    if (url) {
      open(url)
      e.preventDefault()
      e.stopPropagation()
    } else {
      if (props.setStatusDetail) {
        props.setStatusDetail(props.status.id, props.server.id, props.account?.id)
      }
    }
  }

  const emojiClicked = async (e: Entity.Reaction) => {
    if (e.me) {
      const res = await props.client.deleteEmojiReaction(status.id, e.name)
      props.updateStatus(res.data)
    } else {
      const res = await props.client.createEmojiReaction(status.id, e.name)
      props.updateStatus(res.data)
    }
  }

  const refresh = async () => {
    const res = await props.client.getStatus(props.status.id)
    props.updateStatus(res.data)
  }

  if (
    !ignoreFilter &&
    props.filters?.map(f => f.phrase).filter(keyword => props.status.content.toLowerCase().includes(keyword.toLowerCase())).length > 0
  ) {
    return (
      <div className="status" style={{ textAlign: 'center', paddingTop: '0.5em', paddingBottom: '0.5em' }}>
        <FormattedMessage id="timeline.status.filtered" />
        <Button appearance="subtle" size="sm" onClick={() => setIgnoreFilter(true)} style={{ marginLeft: '0.2em' }}>
          <FormattedMessage id="timeline.status.show_anyway" />
        </Button>
      </div>
    )
  }

  return (
    <div className="status">
      {pinnedHeader(props.pinned)}
      {rebloggedHeader(props.status)}
      <div style={{ display: 'flex' }}>
        {/** icon **/}
        <div style={{ width: '56px', padding: '6px', boxSizing: 'border-box' }}>
          <Avatar
            src={status.account.avatar}
            onClick={() => props.setAccountDetail(status.account.id, props.server.id, props.account?.id)}
            style={{ cursor: 'pointer' }}
            title={status.account.acct}
            alt={status.account.acct}
          />
        </div>
        {/** status **/}
        <div style={{ paddingRight: '8px', width: `calc(100% - 56px)`, boxSizing: 'border-box' }}>
          <div className="metadata">
            <FlexboxGrid>
              {/** account name **/}
              <FlexboxGrid.Item
                colspan={18}
                style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}
                onClick={() => props.setAccountDetail(status.account.id, props.server.id, props.account?.id)}
              >
                <span dangerouslySetInnerHTML={{ __html: emojify(status.account.display_name, status.account.emojis) }} />
                <span style={{ color: 'var(--rs-text-tertiary)' }}>@{status.account.acct}</span>
              </FlexboxGrid.Item>
              {/** timestamp **/}
              <FlexboxGrid.Item colspan={6} style={{ textAlign: 'right', color: 'var(--rs-text-tertiary)' }}>
                <Time
                  time={status.created_at}
                  onClick={() => props.setStatusDetail && props.setStatusDetail(props.status.id, props.server.id, props.account?.id)}
                />
              </FlexboxGrid.Item>
            </FlexboxGrid>
          </div>
          <Body status={status} onClick={statusClicked} spoilered={spoilered} setSpoilered={setSpoilered} />
          {!spoilered && (
            <>
              {status.poll && <Poll poll={status.poll} client={props.client} pollUpdated={refresh} emojis={status.emojis} />}
              {status.media_attachments.length > 0 && (
                <Attachments
                  attachments={status.media_attachments}
                  sensitive={status.sensitive}
                  openMedia={props.openMedia}
                  columnWidth={props.columnWidth}
                />
              )}
              {status.emoji_reactions &&
                status.emoji_reactions.map(e => (
                  <Button
                    appearance="subtle"
                    size="sm"
                    key={e.name}
                    onClick={() => emojiClicked(e)}
                    active={e.me}
                    disabled={e.name.includes('@') && props.server.sns === 'firefish'}
                    title={e.name}
                  >
                    {e.url ? (
                      <>
                        <img src={e.url} style={{ height: '20px' }} /> <span style={{ marginLeft: '0.2em' }}>{e.count}</span>
                      </>
                    ) : (
                      <span>
                        {e.name} {e.count}
                      </span>
                    )}
                  </Button>
                ))}
            </>
          )}
          <Actions
            disabled={props.server.account_id === null}
            server={props.server}
            account={props.account}
            status={status}
            client={client}
            setShowReply={setShowReply}
            setShowEdit={setShowEdit}
            updateStatus={props.updateStatus}
            openReport={() => props.openReport(status, props.client)}
            openFromOtherAccount={() => props.openFromOtherAccount(status)}
            customEmojis={props.customEmojis}
            locale={props.locale}
          />
        </div>
      </div>
      {showReply && (
        <div style={{ padding: '8px 12px' }}>
          <Reply client={client} server={props.server} account={props.account} in_reply_to={status} onClose={() => setShowReply(false)} />
        </div>
      )}
      {showEdit && (
        <div style={{ padding: '8px 12px' }}>
          <Reply client={client} server={props.server} account={props.account} edit_target={status} onClose={() => setShowEdit(false)} />
        </div>
      )}
    </div>
  )
}

const originalStatus = (status: Entity.Status) => {
  if (status.reblog && !status.quote) {
    return status.reblog
  } else {
    return status
  }
}

const pinnedHeader = (pinned?: boolean) => {
  if (pinned) {
    return (
      <div style={{ color: 'var(--rs-text-tertiary)' }}>
        <div style={{ alignItems: 'middle', display: 'flex' }}>
          <div style={{ paddingRight: '4px', paddingLeft: '8px', width: '32px', boxSizing: 'border-box' }}>
            <Icon as={BsPin} />
          </div>
          <div
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: 'calc(100% - 32px)'
            }}
          >
            <FormattedMessage id="timeline.status.pinned_post" />
          </div>
        </div>
      </div>
    )
  } else {
    return null
  }
}

const rebloggedHeader = (status: Entity.Status) => {
  if (status.reblog && !status.quote) {
    return (
      <div style={{ color: 'var(--rs-text-tertiary)' }}>
        <div style={{ alignItems: 'middle', display: 'flex' }}>
          <div style={{ paddingRight: '4px', paddingLeft: '8px', width: '32px', boxSizing: 'border-box' }}>
            <Icon as={BsArrowRepeat} style={{ color: 'green' }} />
          </div>
          <div
            style={{
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              width: 'calc(100% - 32px)'
            }}
          >
            <span dangerouslySetInnerHTML={{ __html: emojify(status.account.display_name, status.account.emojis) }} />
          </div>
        </div>
      </div>
    )
  } else {
    return null
  }
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
  try {
    const res = await client.lookupAccount(account.acct)
    return res.data
  } catch (e) {
    const res = await client.searchAccount(account.url, { resolve: true })
    if (res.data.length === 0) return null
    const user = accountMatch(res.data, account, server.domain)
    if (user) return user
    return null
  }
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

export default Status
