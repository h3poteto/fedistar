import { FlexboxGrid, useToaster } from 'rsuite'
import { BsChat, BsEmojiSmile, BsThreeDots, BsStar, BsStarFill, BsBookmark, BsFillBookmarkFill, BsArrowRepeat } from 'react-icons/bs'
import { Icon } from '@rsuite/icons'
import { Dispatch, SetStateAction, ReactElement, useState } from 'react'
import { Entity, MegalodonInterface, Response } from 'megalodon'
import ActionButton from './ActionButton'
import alert from 'src/components/utils/alert'

type Props = {
  disabled: boolean
  status: Entity.Status
  client: MegalodonInterface
  setShowReply: Dispatch<SetStateAction<boolean>>
  updateStatus: (status: Entity.Status) => void
}

const Actions: React.FC<Props> = props => {
  const { status, client } = props
  const [favouriteActivating, setFavouriteActivating] = useState<boolean>(false)
  const [favouriteDeactivating, setFavouriteDeactivating] = useState<boolean>(false)
  const [reblogActivating, setReblogActivating] = useState<boolean>(false)
  const [reblogDeactivating, setReblogDeactivating] = useState<boolean>(false)

  const toast = useToaster()

  const reblog = async () => {
    let res: Response<Entity.Status>
    if (status.reblogged) {
      setReblogActivating(false)
      setReblogDeactivating(true)
      try {
        res = await client.unreblogStatus(status.id)
      } catch {
        toast.push(alert('error', 'Failed to unreblog'), { placement: 'topStart' })
      }
    } else {
      setReblogDeactivating(false)
      setReblogActivating(true)
      try {
        res = await client.reblogStatus(status.id)
      } catch {
        toast.push(alert('error', 'Failed to reblog'), { placement: 'topStart' })
      }
    }
    props.updateStatus(res.data)
  }

  const favourite = async () => {
    let res: Response<Entity.Status>
    if (status.favourited) {
      setFavouriteActivating(false)
      setFavouriteDeactivating(true)
      try {
        res = await client.unfavouriteStatus(status.id)
      } catch {
        toast.push(alert('error', 'Failed to unfavourite'), { placement: 'topStart' })
      }
    } else {
      setFavouriteDeactivating(false)
      setFavouriteActivating(true)
      try {
        res = await client.favouriteStatus(status.id)
      } catch {
        toast.push(alert('error', 'Failed to favourite'), { placement: 'topStart' })
      }
    }
    props.updateStatus(res.data)
  }

  const bookmark = async () => {
    let res: Response<Entity.Status>
    if (status.bookmarked) {
      try {
        res = await client.unbookmarkStatus(status.id)
      } catch {
        toast.push(alert('error', 'Failed to unbookmark'), { placement: 'topStart' })
      }
    } else {
      try {
        res = await client.bookmarkStatus(status.id)
      } catch {
        toast.push(alert('error', 'Failed to bookmark'), { placement: 'topStart' })
      }
    }
    props.updateStatus(res.data)
  }

  return (
    <div className="toolbox">
      <FlexboxGrid>
        <FlexboxGrid.Item>
          <ActionButton disabled={props.disabled} icon={<Icon as={BsChat} />} onClick={() => props.setShowReply(current => !current)} />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item>
          <ActionButton
            disabled={props.disabled}
            className="reblog-action"
            activating={reblogActivating}
            deactivating={reblogDeactivating}
            icon={reblogIcon(props.status)}
            onClick={reblog}
          />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item>
          <ActionButton
            disabled={props.disabled}
            className="favourite-action"
            activating={favouriteActivating}
            deactivating={favouriteDeactivating}
            icon={favouriteIcon(props.status)}
            onClick={favourite}
          />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item>
          <ActionButton disabled={props.disabled} icon={bookmarkIcon(props.status)} onClick={bookmark} />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item>
          <ActionButton icon={<Icon as={BsEmojiSmile} />} disabled />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item>
          <ActionButton icon={<Icon as={BsThreeDots} />} disabled />
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
    return <Icon as={BsFillBookmarkFill} color="red" />
  } else {
    return <Icon as={BsBookmark} />
  }
}

export default Actions
