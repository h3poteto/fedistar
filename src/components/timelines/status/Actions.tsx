import { FlexboxGrid, useToaster, Popover, Whisper, IconButton } from 'rsuite'
import { BsChat, BsEmojiSmile, BsThreeDots, BsStar, BsStarFill, BsBookmark, BsFillBookmarkFill, BsArrowRepeat } from 'react-icons/bs'
import { Icon } from '@rsuite/icons'
import { Dispatch, SetStateAction, ReactElement, useState, forwardRef, useRef } from 'react'
import { Entity, MegalodonInterface, Response } from 'megalodon'
import Picker from '@emoji-mart/react'

import ActionButton from './ActionButton'
import alert from 'src/components/utils/alert'
import { Server } from 'src/entities/server'
import { data } from 'src/utils/emojiData'
import { useTranslation } from 'react-i18next'

type Props = {
  disabled: boolean
  server: Server
  status: Entity.Status
  client: MegalodonInterface
  setShowReply: Dispatch<SetStateAction<boolean>>
  updateStatus: (status: Entity.Status) => void
}

const Actions: React.FC<Props> = props => {
  const { t } = useTranslation()

  const { status, client } = props
  const [favouriteActivating, setFavouriteActivating] = useState<boolean>(false)
  const [favouriteDeactivating, setFavouriteDeactivating] = useState<boolean>(false)
  const [reblogActivating, setReblogActivating] = useState<boolean>(false)
  const [reblogDeactivating, setReblogDeactivating] = useState<boolean>(false)

  const toast = useToaster()
  const emojiPickerRef = useRef(null)

  const reblog = async () => {
    let res: Response<Entity.Status>
    if (status.reblogged) {
      setReblogActivating(false)
      setReblogDeactivating(true)
      try {
        res = await client.unreblogStatus(status.id)
      } catch {
        toast.push(alert('error', t('alert.failed_unreblog')), { placement: 'topStart' })
      }
    } else {
      setReblogDeactivating(false)
      setReblogActivating(true)
      try {
        res = await client.reblogStatus(status.id)
      } catch {
        toast.push(alert('error', t('alert.failed_reblog')), { placement: 'topStart' })
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
        toast.push(alert('error', t('alert.failed_unfavourite')), { placement: 'topStart' })
      }
    } else {
      setFavouriteDeactivating(false)
      setFavouriteActivating(true)
      try {
        res = await client.favouriteStatus(status.id)
      } catch {
        toast.push(alert('error', t('alert.failed_favourite')), { placement: 'topStart' })
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
        toast.push(alert('error', t('alert.failed_unbookmark')), { placement: 'topStart' })
      }
    } else {
      try {
        res = await client.bookmarkStatus(status.id)
      } catch {
        toast.push(alert('error', t('alert.failed_bookmark')), { placement: 'topStart' })
      }
    }
    props.updateStatus(res.data)
  }

  const onEmojiSelect = async emoji => {
    const res = await props.client.createEmojiReaction(props.status.id, emoji.native)
    props.updateStatus(res.data)

    emojiPickerRef?.current.close()
  }

  const EmojiPicker = forwardRef<HTMLDivElement>((props, ref) => (
    <Popover ref={ref} {...props}>
      <Picker data={data} onEmojiSelect={onEmojiSelect} previewPosition="none" set="native" perLine="7" />
    </Popover>
  ))

  return (
    <div className="toolbox">
      <FlexboxGrid>
        <FlexboxGrid.Item>
          <ActionButton
            disabled={props.disabled}
            icon={<Icon as={BsChat} />}
            onClick={() => props.setShowReply(current => !current)}
            title={t('timeline.actions.reply')}
          />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item>
          <ActionButton
            disabled={props.disabled || status.visibility === 'direct' || status.visibility === 'private'}
            className="reblog-action"
            activating={reblogActivating}
            deactivating={reblogDeactivating}
            icon={reblogIcon(props.status)}
            onClick={reblog}
            title={t('timeline.actions.reblog')}
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
            title={t('timeline.actions.favourite')}
          />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item>
          <ActionButton
            disabled={props.disabled}
            icon={bookmarkIcon(props.status)}
            onClick={bookmark}
            title={t('timeline.actions.bookmark')}
          />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item>
          <Whisper trigger="click" placement="bottomStart" ref={emojiPickerRef} speaker={<EmojiPicker />}>
            <IconButton
              appearance="link"
              icon={<Icon as={BsEmojiSmile} />}
              disabled={props.disabled || props.server.sns === 'mastodon'}
              title={t('timeline.actions.emoji_reaction')}
            />
          </Whisper>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item>
          <ActionButton icon={<Icon as={BsThreeDots} />} disabled title={t('timeline.actions.detail')} />
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
