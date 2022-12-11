import { FlexboxGrid, IconButton } from 'rsuite'
import { BsChat, BsEmojiSmile, BsThreeDots, BsStar, BsStarFill, BsBookmark, BsFillBookmarkFill, BsArrowRepeat } from 'react-icons/bs'
import { Icon } from '@rsuite/icons'
import { Dispatch, SetStateAction, ReactElement } from 'react'
import { Entity, MegalodonInterface, Response } from 'megalodon'

type Props = {
  status: Entity.Status
  client: MegalodonInterface
  setShowReply: Dispatch<SetStateAction<boolean>>
  updateStatus: (status: Entity.Status) => void
}

const Actions: React.FC<Props> = props => {
  const { status, client } = props

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
    <div className="toolbox">
      <FlexboxGrid>
        <FlexboxGrid.Item>
          <IconButton appearance="link" icon={<Icon as={BsChat} />} onClick={() => props.setShowReply(current => !current)} />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item>
          <IconButton appearance="link" icon={reblogIcon(props.status)} onClick={reblog} />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item>
          <IconButton appearance="link" icon={favouriteIcon(props.status)} onClick={favourite} />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item>
          <IconButton appearance="link" icon={bookmarkIcon(props.status)} onClick={bookmark} />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item>
          <IconButton appearance="link" icon={<Icon as={BsEmojiSmile} />} disabled />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item>
          <IconButton appearance="link" icon={<Icon as={BsThreeDots} />} disabled />
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </div>
  )
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

export default Actions
