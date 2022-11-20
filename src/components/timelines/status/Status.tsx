import { Entity, MegalodonInterface } from 'megalodon'
import { FlexboxGrid, List, Avatar, IconButton } from 'rsuite'
import { Icon } from '@rsuite/icons'
import { BsArrowRepeat, BsChat, BsStar, BsStarFill, BsBookmark, BsFillBookmarkFill, BsEmojiSmile, BsThreeDots } from 'react-icons/bs'
import Time from 'src/components/utils/Time'
import { ReactElement } from 'react'

type Props = {
  status: Entity.Status
  client: MegalodonInterface
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
      <div>
        <FlexboxGrid align="middle">
          <FlexboxGrid.Item style={{ paddingRight: '8px', textAlign: 'right' }} colspan={4}>
            <Icon as={BsArrowRepeat} style={{ color: 'green' }} />
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={20}>{status.account.display_name}</FlexboxGrid.Item>
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

const Status: React.FC<Props> = props => {
  const { client } = props
  const status = originalStatus(props.status)

  const reblog = async () => {
    await client.reblogStatus(status.id)
  }

  const favourite = async () => {
    await client.favouriteStatus(status.id)
  }

  const bookmark = async () => {
    await client.bookmarkStatus(status.id)
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
                {status.account.display_name}@{status.account.acct}
              </FlexboxGrid.Item>
              {/** timestamp **/}
              <FlexboxGrid.Item colspan={6} style={{ textAlign: 'right' }}>
                <Time time={status.created_at} />
              </FlexboxGrid.Item>
            </FlexboxGrid>
          </div>
          <div className="body" style={{ wordWrap: 'break-word' }} dangerouslySetInnerHTML={{ __html: status.content }}></div>
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

export default Status
