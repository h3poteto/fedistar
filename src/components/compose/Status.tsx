import {
  Form,
  Button,
  ButtonToolbar,
  Schema,
  Whisper,
  Input,
  Popover,
  Dropdown,
  useToaster,
  IconButton,
  Toggle,
  Checkbox,
  FlexboxGrid,
  Radio,
  InputPicker,
  FormControlProps
} from 'rsuite'
import { useState, useEffect, useRef, forwardRef, ChangeEvent } from 'react'
import { Icon } from '@rsuite/icons'
import { BsEmojiLaughing, BsPaperclip, BsMenuButtonWide, BsGlobe, BsUnlock, BsLock, BsEnvelope, BsXCircle, BsX } from 'react-icons/bs'
import { Entity, MegalodonInterface } from 'megalodon'
import Picker from '@emoji-mart/react'

import { data } from 'src/utils/emojiData'
import { Server } from 'src/entities/server'
import { CustomEmojiCategory } from 'src/entities/emoji'
import alert from 'src/components/utils/alert'

type Props = {
  server: Server
  client: MegalodonInterface
  in_reply_to?: Entity.Status
  onClose?: () => void
}

type FormValue = {
  spoiler: string
  status: string
  attachments?: Array<Entity.Attachment | Entity.AsyncAttachment>
  nsfw?: boolean
  poll?: Poll
}

type Poll = {
  options: Array<string>
  expires_in: number
  multiple: boolean
}

const model = Schema.Model({
  status: Schema.Types.StringType().isRequired('This field is required.'),
  attachments: Schema.Types.ArrayType().maxLength(4, "Can't attach over 5 files"),
  poll: Schema.Types.ObjectType().shape({
    options: Schema.Types.ArrayType().of(Schema.Types.StringType().isRequired('Required')).minLength(2, 'Minimum 2 choices required'),
    expires_in: Schema.Types.NumberType().isRequired('Required'),
    multiple: Schema.Types.BooleanType().isRequired('Required')
  })
})

const Status: React.FC<Props> = props => {
  const [formValue, setFormValue] = useState<FormValue>({
    spoiler: '',
    status: ''
  })
  const [formError, setFormError] = useState<any>({})
  const [customEmojis, setCustomEmojis] = useState<Array<CustomEmojiCategory>>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'private' | 'direct'>('public')
  const [cw, setCW] = useState<boolean>(false)

  const formRef = useRef<any>()
  const statusRef = useRef<HTMLDivElement>()
  const emojiPickerRef = useRef(null)
  const uploaderRef = useRef<HTMLInputElement>()
  const toast = useToaster()

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
      setFormValue({ spoiler: '', status: `@${props.in_reply_to.account.acct} ` })
      setVisibility(props.in_reply_to.visibility)
    }
  }, [props.in_reply_to])

  const handleSubmit = async () => {
    if (loading) {
      return
    }
    if (formRef === undefined || formRef.current === undefined) {
      return
    } else if (!formRef.current.check()) {
      toast.push(alert('error', 'Validation error'), { placement: 'topStart' })
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
        if (formValue.attachments) {
          options = Object.assign({}, options, {
            media_ids: formValue.attachments.map(m => m.id)
          })
        }
        if (formValue.nsfw !== undefined) {
          options = Object.assign({}, options, {
            sensitive: formValue.nsfw
          })
        }
        if (formValue.spoiler.length > 0) {
          options = Object.assign({}, options, {
            spoiler_text: formValue.spoiler
          })
        }
        if (formValue.poll != undefined && formValue.poll.options.length > 0) {
          options = Object.assign({}, options, {
            poll: formValue.poll
          })
        }
        await props.client.postStatus(formValue.status, options)
        clear()
      } catch {
        toast.push(alert('error', 'Failed to post status'), { placement: 'topStart' })
      } finally {
        setLoading(false)
      }
    }
  }

  const clear = () => {
    setFormValue({
      spoiler: '',
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

  const selectFile = () => {
    if (uploaderRef.current) {
      uploaderRef.current.click()
    }
  }

  const fileChanged = async (_filepath: string, event: ChangeEvent<HTMLInputElement>) => {
    if (formValue.attachments && formValue.attachments.length >= 4) {
      toast.push(alert('error', "You can't attach over 5 files"), { placement: 'topStart' })
      return
    }

    const file = event.target.files?.item(0)
    if (file === null || file === undefined) {
      return
    }
    if (!file.type.includes('image') && !file.type.includes('video')) {
      toast.push(alert('error', 'You can attach only images or videos'), { placement: 'topStart' })
      return
    }

    // upload
    try {
      setLoading(true)
      const res = await props.client.uploadMedia(file)
      setFormValue(current => {
        if (current.attachments) {
          return Object.assign({}, current, { attachments: [...current.attachments, res.data] })
        }
        return Object.assign({}, current, { attachments: [res.data] })
      })
    } catch {
      toast.push(alert('error', 'Failed to upload your file'), { placement: 'topStart' })
    } finally {
      setLoading(false)
    }
  }

  const removeAttachment = (index: number) => {
    setFormValue(current =>
      Object.assign({}, current, {
        attachments: current.attachments.filter((_, i) => i !== index)
      })
    )
  }

  const togglePoll = () => {
    if (formValue.poll) {
      setFormValue(current =>
        Object.assign({}, current, {
          poll: undefined
        })
      )
    } else {
      setFormValue(current =>
        Object.assign({}, current, {
          poll: defaultPoll()
        })
      )
    }
  }

  const EmojiPicker = forwardRef<HTMLDivElement>((props, ref) => (
    <Popover ref={ref} {...props}>
      <Picker data={data} custom={customEmojis} onEmojiSelect={onEmojiSelect} previewPosition="none" set="native" perLine="7" />
    </Popover>
  ))

  const VisibilityDropdown = ({ onClose, left, top, className }, ref: any) => {
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
    <Form fluid model={model} ref={formRef} onChange={setFormValue} onCheck={setFormError} formValue={formValue}>
      {cw && (
        <Form.Group controlId="spoiler">
          <Form.Control name="spoiler" placeholder="Write your warning here" />
        </Form.Group>
      )}

      <Form.Group controlId="status" style={{ position: 'relative', marginBottom: '4px' }}>
        {/** @ts-ignore **/}
        <Form.Control rows={5} name="status" accepter={Textarea} ref={statusRef} placeholder="What's on your mind?" />
        <Whisper trigger="click" placement="bottomStart" ref={emojiPickerRef} speaker={<EmojiPicker />}>
          <Button appearance="link" style={{ position: 'absolute', top: '4px', right: '8px', padding: 0 }}>
            <Icon as={BsEmojiLaughing} style={{ fontSize: '1.2em' }} />
          </Button>
        </Whisper>
      </Form.Group>
      {formValue.poll && <Form.Control name="poll" accepter={PollInputControl} fieldError={formError.poll} />}

      <Form.Group controlId="actions" style={{ marginBottom: '4px' }}>
        <ButtonToolbar>
          <Input name="attachments" type="file" style={{ display: 'none' }} ref={uploaderRef} onChange={fileChanged} />
          <Button appearance="subtle" onClick={selectFile}>
            <Icon as={BsPaperclip} style={{ fontSize: '1.1em' }} />
          </Button>
          <Button appearance="subtle" onClick={togglePoll}>
            <Icon as={BsMenuButtonWide} style={{ fontSize: '1.1em' }} />
          </Button>
          <Whisper placement="bottomStart" trigger="click" speaker={VisibilityDropdown}>
            <Button appearance="subtle">
              <Icon as={privacyIcon(visibility)} style={{ fontSize: '1.1em' }} />
            </Button>
          </Whisper>
          <Button appearance="subtle" onClick={() => setCW(previous => !previous)}>
            <span style={{ fontSize: '0.8em' }}>CW</span>
          </Button>
        </ButtonToolbar>
      </Form.Group>
      {formValue.attachments?.length > 0 && (
        <Form.Group controlId="nsfw" style={{ marginBottom: '4px' }}>
          <Form.Control name="nsfw" accepter={Toggle} checkedChildren="Sensitive" unCheckedChildren="Not sensitive" />
        </Form.Group>
      )}

      <Form.Group controlId="attachments-preview" style={{ marginBottom: '4px' }}>
        <div>
          {formValue.attachments?.map((media, index) => (
            <div key={index} style={{ position: 'relative' }}>
              <IconButton
                icon={<Icon as={BsXCircle} style={{ fontSize: '1.0em' }} />}
                appearance="subtle"
                size="sm"
                style={{ position: 'absolute', top: 4, left: 4 }}
                onClick={() => removeAttachment(index)}
              />

              <img
                src={media.preview_url}
                style={{
                  width: '100%',
                  height: '140px',
                  objectFit: 'cover',
                  borderRadius: '8px',
                  boxSizing: 'border-box',
                  marginBottom: '4px'
                }}
              />
            </div>
          ))}
        </div>
      </Form.Group>
      <Form.Group>
        <ButtonToolbar style={{ justifyContent: 'flex-end' }}>
          {props.in_reply_to && <Button onClick={clear}>Cancel</Button>}
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

const defaultPoll = () => ({
  options: ['', ''],
  expires_in: 86400,
  multiple: false
})

const expiresList = [
  { label: '5 minutes', value: 300 },
  { label: '30 minutes', value: 1800 },
  { label: '1 hour', value: 3600 },
  { label: '6 hour', value: 21600 },
  { label: '1 day', value: 86400 },
  { label: '3 days', value: 259200 },
  { label: '7 days', value: 604800 }
]

const PollInputControl: FormControlProps<Poll, any> = ({ value, onChange, fieldError }) => {
  const [poll, setPoll] = useState<Poll>(value)
  const errors = fieldError ? fieldError.object : {}

  const handleChangePoll = (nextPoll: Poll) => {
    setPoll(nextPoll)
    onChange(nextPoll)
  }

  const setOption = (value: string, index: number) => {
    const current = poll
    const next = Object.assign({}, current, {
      options: current.options.map((v, i) => {
        if (i === index) return value
        return v
      })
    })
    handleChangePoll(next)
  }

  const addOption = () => {
    const current = poll
    const next = Object.assign({}, current, {
      options: [...current.options, '']
    })
    handleChangePoll(next)
  }

  const removeOption = (index: number) => {
    const current = poll
    const next = Object.assign({}, current, {
      options: current.options.filter((_, i) => i !== index)
    })
    handleChangePoll(next)
  }

  return (
    <>
      <Form.Group controlId="poll">
        {poll.options.map((option, index) => (
          <div key={index}>
            <FlexboxGrid align="middle">
              <FlexboxGrid.Item>{poll.multiple ? <Checkbox disabled /> : <Radio />}</FlexboxGrid.Item>
              <FlexboxGrid.Item>
                <Input value={option} onChange={value => setOption(value, index)} />
              </FlexboxGrid.Item>
              <FlexboxGrid.Item>
                <Button appearance="link" onClick={() => removeOption(index)}>
                  <Icon as={BsX} />
                </Button>
              </FlexboxGrid.Item>
            </FlexboxGrid>
            {errors.options?.array[index] ? <ErrorMessage>{errors.options?.array[index].errorMessage}</ErrorMessage> : null}
          </div>
        ))}
      </Form.Group>
      <Form.Group controlId="meta">
        <FlexboxGrid align="middle" justify="space-between">
          <FlexboxGrid.Item>
            <Toggle
              checkedChildren="multiple"
              unCheckedChildren="simple"
              onChange={value =>
                setPoll(current =>
                  Object.assign({}, current, {
                    multiple: value
                  })
                )
              }
            />
          </FlexboxGrid.Item>
          <FlexboxGrid.Item>
            <Button appearance="ghost" onClick={addOption}>
              Add a choice
            </Button>
          </FlexboxGrid.Item>
          <FlexboxGrid.Item>
            <InputPicker
              data={expiresList}
              value={poll.expires_in}
              cleanable={false}
              onChange={value => setPoll(current => Object.assign({}, current, { expires_in: value }))}
              style={{ width: '100px' }}
            />
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </Form.Group>
    </>
  )
}

const ErrorMessage = ({ children }) => <span style={{ color: 'red' }}>{children}</span>

export default Status
