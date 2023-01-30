import { MouseEventHandler } from 'react'
import { Entity, MegalodonInterface } from 'megalodon'
import { Avatar, Button, FlexboxGrid } from 'rsuite'
import { Icon } from '@rsuite/icons'
import { BsStar, BsArrowRepeat, BsMenuUp, BsHouseDoor, BsPaperclip } from 'react-icons/bs'
import { open } from '@tauri-apps/api/shell'

import Time from 'src/components/utils/Time'
import emojify from 'src/utils/emojify'
import { findLink } from 'src/utils/statusParser'
import Body from '../status/Body'
import Poll from '../status/Poll'

type Props = {
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

const actionText = (notification: Entity.Notification) => {
  switch (notification.type) {
    case 'favourite':
      return (
        <span
          style={{ color: 'var(--rs-text-secondary)' }}
          dangerouslySetInnerHTML={{
            __html: emojify(`${notification.account.display_name} favourited your post`, notification.account.emojis)
          }}
        />
      )
    case 'reblog':
      return (
        <span
          style={{ color: 'var(--rs-text-secondary)' }}
          dangerouslySetInnerHTML={{
            __html: emojify(`${notification.account.display_name} reblogged your post`, notification.account.emojis)
          }}
        />
      )
    case 'poll_expired':
      return (
        <span
          style={{ color: 'var(--rs-text-secondary)' }}
          dangerouslySetInnerHTML={{
            __html: emojify(`${notification.account.display_name}'s poll is expired`, notification.account.emojis)
          }}
        />
      )
    case 'poll_vote':
      return (
        <span
          style={{ color: 'var(--rs-text-secondary)' }}
          dangerouslySetInnerHTML={{
            __html: emojify(`${notification.account.display_name} voted your poll`, notification.account.emojis)
          }}
        />
      )
    case 'quote':
      return (
        <span
          style={{ color: 'var(--rs-text-secondary)' }}
          dangerouslySetInnerHTML={{
            __html: emojify(`${notification.account.display_name} quoted your post`, notification.account.emojis)
          }}
        />
      )
    case 'status':
      return (
        <span
          style={{ color: 'var(--rs-text-secondary)' }}
          dangerouslySetInnerHTML={{
            __html: emojify(`${notification.account.display_name} just post`, notification.account.emojis)
          }}
        />
      )
    case 'emoji_reaction':
      return (
        <span
          style={{ color: 'var(--rs-text-secondary)' }}
          dangerouslySetInnerHTML={{
            __html: emojify(`${notification.account.display_name} reacted your post`, notification.account.emojis)
          }}
        />
      )
    default:
      return null
  }
}

const Reaction: React.FC<Props> = props => {
  const status = props.notification.status

  const refresh = async () => {
    const res = await props.client.getStatus(status.id)
    props.updateStatus(res.data)
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
          {actionText(props.notification)}
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

const statusClicked: MouseEventHandler<HTMLDivElement> = e => {
  const url = findLink(e.target as HTMLElement, 'status-body')
  if (url) {
    open(url)
    e.preventDefault()
  }
}

export default Reaction
