import { MouseEventHandler, ReactElement } from 'react'
import { Entity, MegalodonInterface, Response } from 'megalodon'
import { FlexboxGrid, List, Avatar, IconButton } from 'rsuite'
import { Icon } from '@rsuite/icons'
import { BsArrowRepeat, BsChat, BsStar, BsStarFill, BsBookmark, BsFillBookmarkFill, BsEmojiSmile, BsThreeDots } from 'react-icons/bs'
import { open } from '@tauri-apps/api/shell'
import Time from 'src/components/utils/Time'
import emojify from 'src/utils/emojify'
import Attachments from './Attachments'
import { findLink } from 'src/utils/statusParser'

type Props = {
  status: Entity.Status
  client: MegalodonInterface
  updateStatus: (status: Entity.Status) => void
  openMedia: (media: Entity.Attachment) => void
}

const Status: React.FC<Props> = props => {
  const { client } = props
  const status = originalStatus(props.status)

  const reblog = async () => {
    let res: Response<Entity.Status>
    if (status.reblogged) {
      res = await client.unreblogStatus(status.id)
    } else {
      res = await client.reblogStatus(status.id)
    }
    props.updateStatus(res.data)
  }

  const favourite = async () => {
    let res: Response<Entity.Status>
    if (status.favourited) {
      res = await client.unfavouriteStatus(status.id)
    } else {
      res = await client.favouriteStatus(status.id)
    }
    props.updateStatus(res.data)
  }

  const bookmark = async () => {
    let res: Response<Entity.Status>
    if (status.bookmarked) {
      res = await client.unbookmarkStatus(status.id)
    } else {
      res = await client.bookmarkStatus(status.id)
    }
    props.updateStatus(res.data)
  }

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
          <div
            className="status-body"
            style={{ wordWrap: 'break-word' }}
            dangerouslySetInnerHTML={{ __html: emojify(status.content, status.emojis) }}
            onClick={statusClicked}
          ></div>
          {status.media_attachments.length > 0 && (
            <Attachments attachments={status.media_attachments} sensitive={status.sensitive} openMedia={props.openMedia} />
          )}
          <div className="toolbox">
            <FlexboxGrid>
              <FlexboxGrid.Item>
                <IconButton appearance="link" icon={<Icon as={BsChat} />} disabled />
              </FlexboxGrid.Item>
              <FlexboxGrid.Item>
                <IconButton appearance="link" icon={reblogIcon(status)} onClick={reblog} />
              </FlexboxGrid.Item>
              <FlexboxGrid.Item>
                <IconButton appearance="link" icon={favouriteIcon(status)} onClick={favourite} />
              </FlexboxGrid.Item>
              <FlexboxGrid.Item>
                <IconButton appearance="link" icon={bookmarkIcon(status)} onClick={bookmark} />
              </FlexboxGrid.Item>
              <FlexboxGrid.Item>
                <IconButton appearance="link" icon={<Icon as={BsEmojiSmile} />} disabled />
              </FlexboxGrid.Item>
              <FlexboxGrid.Item>
                <IconButton appearance="link" icon={<Icon as={BsThreeDots} />} disabled />
              </FlexboxGrid.Item>
            </FlexboxGrid>
          </div>
        </FlexboxGrid.Item>
      </FlexboxGrid>
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

const reblogIcon = (status: Entity.Status): ReactElement => {
  if (status.reblogged) {
    return <Icon as={BsArrowRepeat} color="green" />
  } else {
    return <Icon as={BsArrowRepeat} />
  }
}

const favouriteIcon = (status: Entity.Status): ReactElement => {
  if (status.favourited) {
    return <Icon as={BsStarFill} color="orange" />
  } else {
    return <Icon as={BsStar} />
  }
}

const bookmarkIcon = (status: Entity.Status): ReactElement => {
  if (status.bookmarked) {
    return <Icon as={BsFillBookmarkFill} color="green" />
  } else {
    return <Icon as={BsBookmark} />
  }
}

export default Status
