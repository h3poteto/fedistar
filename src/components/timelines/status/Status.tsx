import { MouseEventHandler, useEffect, useState } from 'react'
import { Entity, MegalodonInterface } from 'megalodon'
import { FlexboxGrid, List, Avatar } from 'rsuite'
import { Icon } from '@rsuite/icons'
import { BsArrowRepeat } from 'react-icons/bs'
import { open } from '@tauri-apps/api/shell'
import Time from 'src/components/utils/Time'
import emojify from 'src/utils/emojify'
import Attachments from './Attachments'
import { findLink } from 'src/utils/statusParser'
import Reply from 'src/components/compose/Status'
import Body from './Body'
import { Server } from 'src/entities/server'
import Actions from './Actions'

type Props = {
  status: Entity.Status
  client: MegalodonInterface
  server: Server
  updateStatus: (status: Entity.Status) => void
  openMedia: (media: Entity.Attachment) => void
  setReplyOpened: (opened: boolean) => void
}

const Status: React.FC<Props> = props => {
  const { client } = props
  const [showReply, setShowReply] = useState<boolean>(false)

  const status = originalStatus(props.status)

  useEffect(() => {
    props.setReplyOpened(showReply)
  }, [showReply])

  return (
    <List.Item style={{ paddingTop: '2px', paddingBottom: '2px' }}>
      {rebloggedHeader(props.status)}
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
                <span dangerouslySetInnerHTML={{ __html: emojify(status.account.display_name, status.account.emojis) }} />
                <span style={{ color: 'var(--rs-text-tertiary)' }}>@{status.account.acct}</span>
              </FlexboxGrid.Item>
              {/** timestamp **/}
              <FlexboxGrid.Item colspan={6} style={{ textAlign: 'right', color: 'var(--rs-text-tertiary)' }}>
                <Time time={status.created_at} />
              </FlexboxGrid.Item>
            </FlexboxGrid>
          </div>
          <Body status={status} onClick={statusClicked} />
          {status.media_attachments.length > 0 && (
            <Attachments attachments={status.media_attachments} sensitive={status.sensitive} openMedia={props.openMedia} />
          )}
          <Actions
            disabled={props.server.account_id === null}
            status={status}
            client={client}
            setShowReply={setShowReply}
            updateStatus={props.updateStatus}
          />
        </FlexboxGrid.Item>
      </FlexboxGrid>
      {showReply && (
        <div style={{ padding: '8px 12px' }}>
          <Reply client={client} server={props.server} in_reply_to={status} onClose={() => setShowReply(false)} />
        </div>
      )}
    </List.Item>
  )
}

const statusClicked: MouseEventHandler<HTMLDivElement> = e => {
  const url = findLink(e.target as HTMLElement, 'status-body')
  if (url) {
    open(url)
    e.preventDefault()
  }
}

const originalStatus = (status: Entity.Status) => {
  if (status.reblog && !status.quote) {
    return status.reblog
  } else {
    return status
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
