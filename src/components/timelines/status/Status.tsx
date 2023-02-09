import { HTMLAttributes, MouseEventHandler, useEffect, useState } from 'react'
import { Entity, MegalodonInterface } from 'megalodon'
import { FlexboxGrid, Avatar, Button } from 'rsuite'
import { Icon } from '@rsuite/icons'
import { BsArrowRepeat, BsPin } from 'react-icons/bs'
import { open } from '@tauri-apps/api/shell'
import Time from 'src/components/utils/Time'
import emojify from 'src/utils/emojify'
import Attachments from './Attachments'
import { findLink } from 'src/utils/statusParser'
import Reply from 'src/components/compose/Status'
import { Account } from 'src/entities/account'
import { Server } from 'src/entities/server'
import Body from './Body'
import Actions from './Actions'
import Poll from './Poll'

type Props = {
  status: Entity.Status
  client: MegalodonInterface
  server: Server
  account: Account | null
  pinned?: boolean
  updateStatus: (status: Entity.Status) => void
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
  setReplyOpened?: (opened: boolean) => void
  setStatusDetail?: (statusId: string, serverId: number, accountId?: number) => void
  setAccountDetail: (userId: string, serverId: number, accountId?: number) => void
} & HTMLAttributes<HTMLElement>

const Status: React.FC<Props> = props => {
  const { client } = props
  const [showReply, setShowReply] = useState<boolean>(false)

  const status = originalStatus(props.status)

  useEffect(() => {
    if (props.setReplyOpened) {
      props.setReplyOpened(showReply)
    }
  }, [showReply])

  const statusClicked: MouseEventHandler<HTMLDivElement> = e => {
    const url = findLink(e.target as HTMLElement, 'status-body')
    if (url) {
      open(url)
      e.preventDefault()
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

  return (
    <div className="status">
      {pinnedHeader(props.pinned)}
      {rebloggedHeader(props.status)}
      <FlexboxGrid>
        {/** icon **/}
        <FlexboxGrid.Item colspan={4}>
          <div style={{ margin: '6px' }}>
            <Avatar
              src={status.account.avatar}
              onClick={() => props.setAccountDetail(status.account.id, props.server.id, props.account?.id)}
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
                  onClick={() => props.setStatusDetail && props.setStatusDetail(props.status.id, props.server.id, props.account.id)}
                />
              </FlexboxGrid.Item>
            </FlexboxGrid>
          </div>
          <Body status={status} onClick={statusClicked} />
          {status.poll && <Poll poll={status.poll} client={props.client} pollUpdated={refresh} />}
          {status.media_attachments.length > 0 && (
            <Attachments attachments={status.media_attachments} sensitive={status.sensitive} openMedia={props.openMedia} />
          )}
          {status.emoji_reactions &&
            status.emoji_reactions.map(e => (
              <Button appearance="subtle" size="sm" key={e.name} onClick={() => emojiClicked(e)}>
                {e.name} {e.count}
              </Button>
            ))}
          <Actions
            disabled={props.server.account_id === null}
            server={props.server}
            status={status}
            client={client}
            setShowReply={setShowReply}
            updateStatus={props.updateStatus}
          />
        </FlexboxGrid.Item>
      </FlexboxGrid>
      {showReply && (
        <div style={{ padding: '8px 12px' }}>
          <Reply client={client} server={props.server} account={props.account} in_reply_to={status} onClose={() => setShowReply(false)} />
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
        <FlexboxGrid align="middle">
          <FlexboxGrid.Item style={{ paddingRight: '8px', textAlign: 'right' }} colspan={4}>
            <Icon as={BsPin} />
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={20}>Pinned post</FlexboxGrid.Item>
        </FlexboxGrid>
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
        <FlexboxGrid align="middle">
          <FlexboxGrid.Item style={{ paddingRight: '8px', textAlign: 'right' }} colspan={4}>
            <Icon as={BsArrowRepeat} style={{ color: 'green' }} />
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={20}>
            <span dangerouslySetInnerHTML={{ __html: emojify(status.account.display_name, status.account.emojis) }} />
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </div>
    )
  } else {
    return null
  }
}

export default Status
