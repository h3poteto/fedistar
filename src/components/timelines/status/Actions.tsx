import { open } from '@tauri-apps/plugin-shell'
import { writeText } from '@tauri-apps/plugin-clipboard-manager'
import { FlexboxGrid, useToaster, Popover, Whisper, IconButton, Dropdown } from 'rsuite'
import {
  BsChat,
  BsEmojiSmile,
  BsThreeDots,
  BsStar,
  BsStarFill,
  BsBookmark,
  BsFillBookmarkFill,
  BsArrowRepeat,
  BsEnvelope,
  BsLock
} from 'react-icons/bs'
import { Icon } from '@rsuite/icons'
import { Dispatch, SetStateAction, ReactElement, useState, forwardRef, useRef, useContext } from 'react'
import { Entity, MegalodonInterface, Response } from 'megalodon'
import Picker from '@emoji-mart/react'

import ActionButton from './ActionButton'
import alert from 'src/components/utils/alert'
import { Server } from 'src/entities/server'
import { data } from 'src/utils/emojiData'
import { Account } from 'src/entities/account'
import { FormattedMessage, useIntl } from 'react-intl'
import { Context } from 'src/theme'
import { CustomEmojiCategory } from 'src/entities/emoji'

type Props = {
  disabled:
    | boolean
    | {
        reply: boolean
        reblog: boolean
        favourite: boolean
        bookmark: boolean
        emoji: boolean
        detail: boolean
      }
  server: Server
  account: Account | null
  status: Entity.Status
  client: MegalodonInterface
  setShowReply?: Dispatch<SetStateAction<boolean>>
  setShowEdit?: Dispatch<SetStateAction<boolean>>
  updateStatus: (status: Entity.Status) => void
  openReport?: () => void
  openFromOtherAccount?: () => void
  customEmojis: Array<CustomEmojiCategory>
  locale: string
  confirmReblog: boolean
}

const Actions: React.FC<Props> = props => {
  const { formatMessage } = useIntl()
  const { theme } = useContext(Context)

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
        toast.push(alert('error', formatMessage({ id: 'alert.failed_unreblog' })), { placement: 'topStart' })
      }
    } else {
      setReblogDeactivating(false)
      setReblogActivating(true)
      try {
        res = await client.reblogStatus(status.id)
      } catch {
        toast.push(alert('error', formatMessage({ id: 'alert.failed_reblog' })), { placement: 'topStart' })
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
        toast.push(alert('error', formatMessage({ id: 'alert.failed_unfavourite' })), { placement: 'topStart' })
      }
    } else {
      setFavouriteDeactivating(false)
      setFavouriteActivating(true)
      try {
        res = await client.favouriteStatus(status.id)
      } catch {
        toast.push(alert('error', formatMessage({ id: 'alert.failed_favourite' })), { placement: 'topStart' })
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
        toast.push(alert('error', formatMessage({ id: 'alert.failed_unbookmark' })), { placement: 'topStart' })
      }
    } else {
      try {
        res = await client.bookmarkStatus(status.id)
      } catch {
        toast.push(alert('error', formatMessage({ id: 'alert.failed_bookmark' })), { placement: 'topStart' })
      }
    }
    props.updateStatus(res.data)
  }

  const simpleLocale = props.locale ? props.locale.split('-')[0] : 'en'

  const onEmojiSelect = async emoji => {
    let name = emoji.name
    if (emoji.native) {
      name = emoji.native
    }
    const res = await props.client.createEmojiReaction(props.status.id, name)
    props.updateStatus(res.data)

    emojiPickerRef?.current.close()
  }

  const EmojiPicker = forwardRef<HTMLDivElement>((prop, ref) => (
    <div ref={ref} {...prop} style={{ position: 'absolute' }}>
      <Picker
        data={data}
        custom={props.customEmojis}
        onEmojiSelect={onEmojiSelect}
        previewPosition="none"
        set="native"
        perLine="6"
        theme={theme === 'high-contrast' ? 'dark' : theme}
        locale={simpleLocale}
      />
    </div>
  ))

  return (
    <div className="toolbox">
      <FlexboxGrid>
        <FlexboxGrid.Item>
          <ActionButton
            disabled={typeof props.disabled === 'boolean' ? props.disabled : props.disabled.reply}
            icon={<Icon as={BsChat} />}
            onClick={() => props.setShowReply(current => !current)}
            title={formatMessage({ id: 'timeline.actions.reply' })}
          />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item>
          <ActionButton
            disabled={
              (typeof props.disabled === 'boolean' ? props.disabled : props.disabled.reblog) ||
              status.visibility === 'direct' ||
              status.visibility === 'private'
            }
            className="reblog-action"
            activating={reblogActivating}
            deactivating={reblogDeactivating}
            icon={reblogIcon(props.status)}
            onClick={reblog}
            confirm={props.confirmReblog && !status.reblogged}
            confirmText={formatMessage({ id: 'timeline.actions.confirm_reblog.text' })}
            title={formatMessage({ id: 'timeline.actions.reblog' })}
          />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item>
          <ActionButton
            disabled={typeof props.disabled === 'boolean' ? props.disabled : props.disabled.favourite}
            className="favourite-action"
            activating={favouriteActivating}
            deactivating={favouriteDeactivating}
            icon={favouriteIcon(props.status)}
            onClick={favourite}
            title={formatMessage({ id: 'timeline.actions.favourite' })}
          />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item>
          <ActionButton
            disabled={typeof props.disabled === 'boolean' ? props.disabled : props.disabled.bookmark}
            icon={bookmarkIcon(props.status)}
            onClick={bookmark}
            title={formatMessage({ id: 'timeline.actions.bookmark' })}
          />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item>
          {/** delay is required to fix popover position **/}
          <Whisper trigger="click" preventOverflow delay={100} ref={emojiPickerRef} speaker={<EmojiPicker />}>
            <IconButton
              appearance="link"
              icon={<Icon as={BsEmojiSmile} />}
              disabled={(typeof props.disabled === 'boolean' ? props.disabled : props.disabled.emoji) || props.server.sns === 'mastodon'}
              title={formatMessage({ id: 'timeline.actions.emoji_reaction' })}
            />
          </Whisper>
        </FlexboxGrid.Item>
        <FlexboxGrid.Item>
          <Whisper
            trigger="click"
            preventOverflow
            speaker={({ className, left, top, onClose }, ref) =>
              detailMenu(
                {
                  className,
                  left,
                  top,
                  onClose,
                  own: props.account && props.account.account_id === props.status.account.id,
                  status: props.status,
                  disabled: typeof props.disabled === 'boolean' ? props.disabled : props.disabled.detail,
                  openBrowser: () => {
                    open(status.url)
                  },
                  copyLink: async () => {
                    await writeText(status.url)
                  },
                  openEdit: () => {
                    props.setShowEdit(current => !current)
                  },
                  onDelete: () => {
                    // After after deleted, streaming will receive a delete event.
                    // So we don't need update parent timelines, the delete event will be handled.
                    client.deleteStatus(props.status.id)
                  },
                  onReport: () => {
                    props.openReport()
                  },
                  onFromOtherAccount: () => {
                    props.openFromOtherAccount()
                  }
                },
                ref
              )
            }
          >
            <IconButton appearance="link" icon={<Icon as={BsThreeDots} />} title={formatMessage({ id: 'timeline.actions.detail.title' })} />
          </Whisper>
        </FlexboxGrid.Item>
      </FlexboxGrid>
    </div>
  )
}

const reblogIcon = (status: Entity.Status): ReactElement => {
  if (status.reblogged) {
    return <Icon as={BsArrowRepeat} color="green" />
  } else {
    switch (status.visibility) {
      case 'direct':
        return <Icon as={BsEnvelope} />
      case 'private':
        return <Icon as={BsLock} />
      default:
        return <Icon as={BsArrowRepeat} />
    }
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

type DetailMenuProps = {
  className: string
  left?: number
  top?: number
  own: boolean
  status: Entity.Status
  disabled: boolean
  openBrowser: () => void
  copyLink: () => void
  onDelete: () => void
  openEdit: () => void
  onClose: (delay?: number) => NodeJS.Timeout | void
  onReport: () => void
  onFromOtherAccount: () => void
}

const detailMenu = (props: DetailMenuProps, ref: React.RefCallback<HTMLElement>) => {
  const { left, top, className, status } = props

  const handleSelect = async (eventKey: string) => {
    props.onClose()
    switch (eventKey) {
      case 'browser':
        props.openBrowser()
        return
      case 'copy':
        props.copyLink()
        return
      case 'edit':
        props.openEdit()
        return
      case 'delete':
        props.onDelete()
        return
      case 'report':
        props.onReport()
        return
      case 'from_other_account':
        props.onFromOtherAccount()
        return
    }
  }

  return (
    <Popover className={className} ref={ref} style={{ left, top, padding: 0 }}>
      <Dropdown.Menu onSelect={handleSelect}>
        <Dropdown.Item eventKey="browser">
          <FormattedMessage id="timeline.actions.detail.browser" />
        </Dropdown.Item>
        <Dropdown.Item eventKey="copy">
          <FormattedMessage id="timeline.actions.detail.copy" />
        </Dropdown.Item>
        {props.own && (
          <Dropdown.Item disabled={props.disabled} eventKey="edit">
            <FormattedMessage id="timeline.actions.detail.edit" />
          </Dropdown.Item>
        )}
        {props.own && (
          <Dropdown.Item disabled={props.disabled} eventKey="delete">
            <FormattedMessage id="timeline.actions.detail.delete" />
          </Dropdown.Item>
        )}
        <Dropdown.Separator />
        <Dropdown.Item disabled={props.disabled} eventKey="report">
          <FormattedMessage id="timeline.actions.detail.report" values={{ user: `@${status.account.username}` }} />
        </Dropdown.Item>
        <Dropdown.Separator />
        <Dropdown.Item eventKey="from_other_account">
          <FormattedMessage id="timeline.actions.detail.from_other_account" />
        </Dropdown.Item>
      </Dropdown.Menu>
    </Popover>
  )
}

export default Actions
