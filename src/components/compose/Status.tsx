import { Form, Button, ButtonToolbar, Schema, Whisper, Input, Popover, Dropdown } from 'rsuite'
import { useState, useEffect, useRef, forwardRef } from 'react'
import { Icon } from '@rsuite/icons'
import { BsEmojiLaughing, BsPaperclip, BsMenuButtonWide, BsGlobe, BsUnlock, BsLock, BsEnvelope } from 'react-icons/bs'
import { Entity, MegalodonInterface } from 'megalodon'
import Picker from '@emoji-mart/react'

import { data } from 'src/utils/emojiData'
import { Server } from 'src/entities/server'

type Props = {
  server: Server
  client: MegalodonInterface
  in_reply_to?: Entity.Status
  onClose?: () => void
}

type FormValue = {
  status: string
}

type CustomEmojiCategory = {
  id: string
  name: string
  emojis: Array<CustomEmoji>
}

type CustomEmoji = {
  id: string
  name: string
  keywords: Array<string>
  skins: Array<{ src: string }>
}

const Status: React.FC<Props> = props => {
  const [formValue, setFormValue] = useState<FormValue>({
    status: ''
  })
  const [customEmojis, setCustomEmojis] = useState<Array<CustomEmojiCategory>>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'private' | 'direct'>('public')

  const formRef = useRef<any>()
  const statusRef = useRef<HTMLDivElement>()
  const emojiPickerRef = useRef(null)

  useEffect(() => {
    if (!props.client || !props.server) {
      return
    }

    const f = async () => {
      const emojis = await props.client.getInstanceCustomEmojis()
      setCustomEmojis([
        {
          id: props.server.domain,
          name: props.server.domain,
          emojis: emojis.data
            .map(emoji => ({
              name: emoji.shortcode,
              image: emoji.url
            }))
            .filter((e, i, array) => array.findIndex(ar => e.name === ar.name) === i)
            .map(e => ({
              id: e.name,
              name: e.name,
              keywords: [e.name],
              skins: [{ src: e.image }]
            }))
        }
      ])
    }
    f()
  }, [props.server, props.client])

  useEffect(() => {
    if (props.in_reply_to) {
      setFormValue({ status: `@${props.in_reply_to.account.acct} ` })
      setVisibility(props.in_reply_to.visibility)
    }
  }, [props.in_reply_to])

  const model = Schema.Model({
    status: Schema.Types.StringType().isRequired('This field is required.')
  })

  const handleSubmit = async () => {
    if (loading) {
      return
    }
    if (formRef === undefined || formRef.current === undefined) {
      return
    } else if (!formRef.current.check()) {
      console.error('Validation Error')
      return
    } else {
      setLoading(true)
      try {
        let options = { visibility: visibility }
        if (props.in_reply_to) {
          options = Object.assign({}, options, {
            in_reply_to_id: props.in_reply_to.id
          })
        }
        await props.client.postStatus(formValue.status, options)
        clear()
      } finally {
        setLoading(false)
      }
    }
  }

  const clear = () => {
    setFormValue({
      status: ''
    })
    if (props.onClose) {
      props.onClose()
    }
  }

  const onEmojiSelect = emoji => {
    const textarea = statusRef.current.firstElementChild as HTMLTextAreaElement
    const cursor = textarea.selectionStart
    if (emoji.native) {
      setFormValue(current =>
        Object.assign({}, current, {
          status: `${current.status.slice(0, cursor)}${emoji.native} ${current.status.slice(cursor)}`
        })
      )
    } else if (emoji.shortcodes) {
      // Custom emojis don't have native code
      setFormValue(current =>
        Object.assign({}, current, {
          status: `${current.status.slice(0, cursor)}${emoji.shortcodes} ${current.status.slice(cursor)}`
        })
      )
    }
    emojiPickerRef?.current.close()
  }

  const EmojiPicker = forwardRef<HTMLDivElement>((props, ref) => (
    <Popover ref={ref} {...props}>
      <Picker data={data} custom={customEmojis} onEmojiSelect={onEmojiSelect} previewPosition="none" set="native" perLine="7" />
    </Popover>
  ))

  const VisibilityDropdown = ({ onClose, left, top, className }, ref) => {
    const handleSelect = (key: string) => {
      onClose()
      if (key === 'public' || key === 'unlisted' || key === 'private' || key === 'direct') {
        setVisibility(key)
      }
    }
    return (
      <Popover ref={ref} className={className} style={{ left, top }} full>
        <Dropdown.Menu onSelect={handleSelect}>
          <Dropdown.Item eventKey={'public'} icon={<Icon as={BsGlobe} />}>
            Public
          </Dropdown.Item>
          <Dropdown.Item eventKey={'unlisted'} icon={<Icon as={BsUnlock} />}>
            Unlisted
          </Dropdown.Item>
          <Dropdown.Item eventKey={'private'} icon={<Icon as={BsLock} />}>
            Private
          </Dropdown.Item>
          <Dropdown.Item eventKey={'direct'} icon={<Icon as={BsEnvelope} />}>
            Direct
          </Dropdown.Item>
        </Dropdown.Menu>
      </Popover>
    )
  }

  return (
    <Form fluid model={model} ref={formRef} onChange={setFormValue} formValue={formValue}>
      <Form.Group controlId="status" style={{ position: 'relative', marginBottom: '4px' }}>
        {/** @ts-ignore **/}
        <Form.Control rows={5} name="status" accepter={Textarea} ref={statusRef} />
        <Whisper trigger="click" placement="bottomStart" ref={emojiPickerRef} speaker={<EmojiPicker />}>
          <Button appearance="link" style={{ position: 'absolute', top: '4px', right: '8px', padding: 0 }}>
            <Icon as={BsEmojiLaughing} style={{ fontSize: '1.2em' }} />
          </Button>
        </Whisper>
      </Form.Group>
      <Form.Group controlId="actions">
        <ButtonToolbar>
          <Button appearance="subtle" disabled>
            <Icon as={BsPaperclip} style={{ fontSize: '1.1em' }} />
          </Button>
          <Button appearance="subtle" disabled>
            <Icon as={BsMenuButtonWide} style={{ fontSize: '1.1em' }} />
          </Button>
          <Whisper placement="bottomStart" trigger="click" speaker={VisibilityDropdown}>
            <Button appearance="subtle">
              <Icon as={privacyIcon(visibility)} style={{ fontSize: '1.1em' }} />
            </Button>
          </Whisper>
        </ButtonToolbar>
      </Form.Group>
      <Form.Group>
        <ButtonToolbar style={{ justifyContent: 'flex-end' }}>
          <Button appearance="primary" type="submit" onClick={handleSubmit} loading={loading}>
            Post
          </Button>
        </ButtonToolbar>
      </Form.Group>
    </Form>
  )
}

const privacyIcon = (visibility: 'public' | 'unlisted' | 'private' | 'direct') => {
  switch (visibility) {
    case 'public':
      return BsGlobe
    case 'unlisted':
      return BsUnlock
    case 'private':
      return BsLock
    case 'direct':
      return BsEnvelope
    default:
      return BsGlobe
  }
}

const Textarea = forwardRef<HTMLTextAreaElement>((props, ref) => <Input {...props} as="textarea" ref={ref} />)

export default Status
