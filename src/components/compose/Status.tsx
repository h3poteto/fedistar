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
  FormControlProps,
  DatePicker
} from 'rsuite'
import { useState, useEffect, useRef, forwardRef, ChangeEvent, useCallback, useContext } from 'react'
import { Icon } from '@rsuite/icons'
import {
  BsEmojiLaughing,
  BsPaperclip,
  BsMenuButtonWide,
  BsGlobe,
  BsUnlock,
  BsLock,
  BsEnvelope,
  BsXCircle,
  BsX,
  BsPencil,
  BsClock,
  BsPeople
} from 'react-icons/bs'
import { Entity, MegalodonInterface } from 'megalodon'
import Picker from '@emoji-mart/react'
import { invoke } from '@tauri-apps/api/core'

import { data, mapCustomEmojiCategory } from 'src/utils/emojiData'
import { Server } from 'src/entities/server'
import { CustomEmojiCategory } from 'src/entities/emoji'
import alert from 'src/components/utils/alert'
import { Account } from 'src/entities/account'
import AutoCompleteTextarea, { ArgProps as AutoCompleteTextareaProps } from './AutoCompleteTextarea'
import languages from 'src/utils/languages'
import EditMedia from './EditMedia'
import { FormattedMessage, useIntl } from 'react-intl'
import { Context } from 'src/theme'

type Props = {
  server: Server
  account: Account
  client: MegalodonInterface
  in_reply_to?: Entity.Status
  edit_target?: Entity.Status
  quote_target?: Entity.Status
  defaultVisibility?: 'public' | 'unlisted' | 'private' | 'direct' | 'local'
  defaultNSFW?: boolean
  defaultLanguage?: string | null
  onClose?: () => void
  locale: string
}

type FormValue = {
  spoiler: string
  status: string
  attachments?: Array<Entity.Attachment | Entity.AsyncAttachment>
  nsfw?: boolean
  poll?: Poll
  scheduled_at?: Date
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
    expires_in: Schema.Types.NumberType().isInteger('Must be a number').min(0, 'Must be greater than 0'),
    multiple: Schema.Types.BooleanType()
  }),
  scheduled_at: Schema.Types.DateType().addRule((value, _data) => {
    const limit = new Date()
    limit.setMinutes(limit.getMinutes() + 5)
    if (value <= limit) {
      return false
    }
    return true
  }, 'Must be at least 5 minutes in the future')
})

const Status: React.FC<Props> = props => {
  const { formatMessage } = useIntl()
  const { theme } = useContext(Context)

  const [formValue, setFormValue] = useState<FormValue>({
    spoiler: '',
    status: ''
  })
  const [formError, setFormError] = useState<any>({})
  const [customEmojis, setCustomEmojis] = useState<Array<CustomEmojiCategory>>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [visibility, setVisibility] = useState<'public' | 'unlisted' | 'private' | 'direct' | 'local'>('public')
  const [cw, setCW] = useState<boolean>(false)
  const [language, setLanguage] = useState<string>('en')
  const [editMediaModal, setEditMediaModal] = useState(false)
  const [editMedia, setEditMedia] = useState<Entity.Attachment | null>(null)
  const [maxCharacters, setMaxCharacters] = useState<number | null>(null)
  const [remaining, setRemaining] = useState<number | null>(null)

  const formRef = useRef<any>(null)
  const cwRef = useRef<HTMLDivElement>(null)
  const statusRef = useRef<HTMLDivElement>(null)
  const emojiPickerRef = useRef(null)
  const uploaderRef = useRef<HTMLInputElement>(null)
  const toast = useToaster()

  // Update instance custom emoji
  useEffect(() => {
    if (!props.client || !props.server) {
      return
    }

    const f = async () => {
      const instance = await invoke<Entity.Instance>('get_instance', { serverId: props.server.id })
      if (instance.configuration.statuses.max_characters) {
        setMaxCharacters(instance.configuration.statuses.max_characters)
      }
      const emojis = await props.client.getInstanceCustomEmojis()
      setCustomEmojis(mapCustomEmojiCategory(props.server.domain, emojis.data))
    }
    f()
  }, [props.server, props.client])

  // Set replyTo or edit target
  useEffect(() => {
    if (props.in_reply_to) {
      const mentionAccounts = [props.in_reply_to.account.acct, ...props.in_reply_to.mentions.map(a => a.acct)]
        .filter((a, i, self) => self.indexOf(a) === i)
        .filter(a => a !== props.account.username)
      setFormValue({ spoiler: '', status: `${mentionAccounts.map(m => `@${m}`).join(' ')} ` })
      setVisibility(props.in_reply_to.visibility)
      if (props.in_reply_to.language) {
        setLanguage(props.in_reply_to.language)
      }
    } else if (props.edit_target) {
      const target = props.edit_target

      const f = async () => {
        // The content is wrapped with HTML, so we want plain content.
        const res = await props.client.getStatusSource(target.id)

        let value = {
          spoiler: res.data.spoiler_text,
          status: res.data.text
        }

        if (target.sensitive) {
          value = Object.assign(value, {
            nsfw: target.sensitive
          })
        }
        if (target.media_attachments.length > 0) {
          value = Object.assign(value, {
            attachments: target.media_attachments
          })
        }
        setFormValue(value)
        setVisibility(target.visibility)
        if (target.language) {
          setLanguage(target.language)
        }
      }
      f()
    } else if (props.quote_target) {
      // Nothing todo
    } else {
      clear()
    }
  }, [props.in_reply_to, props.edit_target, props.quote_target, props.account, props.client])

  // Set visibility
  useEffect(() => {
    if (props.defaultVisibility) {
      setVisibility(props.defaultVisibility)
    }
  }, [props.defaultVisibility])

  // Set NSFW
  useEffect(() => {
    if (props.defaultNSFW) {
      setFormValue(current =>
        Object.assign({}, current, {
          nsfw: props.defaultNSFW
        })
      )
    }
  }, [props.defaultNSFW])

  // Set Language
  useEffect(() => {
    if (props.defaultLanguage) {
      setLanguage(props.defaultLanguage)
    } else {
      const key = localStorage.getItem('language')
      if (key) {
        setLanguage(key)
      }
    }
  }, [props.defaultLanguage, props.client])

  // Set Remaining
  useEffect(() => {
    if (maxCharacters) {
      setRemaining(maxCharacters - formValue.status.length - formValue.spoiler.length)
    }
  }, [maxCharacters, formValue])

  const handleSubmit = async () => {
    if (loading) {
      return
    }
    if (formRef === undefined || formRef.current === undefined) {
      return
    } else if (!formRef.current.check()) {
      toast.push(alert('error', formatMessage({ id: 'alert.validation_error' })), { placement: 'topStart' })
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
        if (props.quote_target) {
          options = Object.assign({}, options, {
            quote_id: props.quote_target.id
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
        if (language) {
          options = Object.assign({}, options, {
            language: language
          })
        }
        if (formValue.spoiler.length > 0) {
          options = Object.assign({}, options, {
            spoiler_text: formValue.spoiler
          })
        }
        if (formValue.poll !== undefined && formValue.poll.options.length > 0) {
          options = Object.assign({}, options, {
            poll: formValue.poll
          })
        }
        if (formValue.scheduled_at !== undefined) {
          options = Object.assign({}, options, {
            scheduled_at: formValue.scheduled_at.toISOString()
          })
        }
        if (props.edit_target) {
          await props.client.editStatus(
            props.edit_target.id,
            Object.assign({}, options, {
              status: formValue.status
            })
          )
        } else {
          await props.client.postStatus(formValue.status, options)
        }
        clear()
      } catch (err) {
        console.error(err)
        toast.push(alert('error', formatMessage({ id: 'alert.failed_post' })), { placement: 'topStart' })
      } finally {
        setLoading(false)
      }
    }
  }

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (event.ctrlKey === true && event.key === 'Enter') {
        if (
          document.activeElement === statusRef.current?.firstElementChild ||
          document.activeElement === cwRef.current?.firstElementChild
        ) {
          handleSubmit()
        }
      }
    },
    [handleSubmit]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)

    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress])

  const clear = () => {
    setFormValue({
      spoiler: '',
      status: ''
    })
    setCW(false)
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
    if (formValue.attachments && formValue.attachments.length > 4) {
      toast.push(alert('error', formatMessage({ id: 'alert.validation_attachments_length' }, { limit: 5 })), { placement: 'topStart' })
      return
    }

    const file = event.target.files?.item(0)
    if (file === null || file === undefined) {
      return
    }
    if (!file.type.includes('image') && !file.type.includes('video')) {
      toast.push(alert('error', formatMessage({ id: 'alert.validation_attachments_type' })), { placement: 'topStart' })
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
      toast.push(alert('error', formatMessage({ id: 'alert.upload_error' })), { placement: 'topStart' })
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

  const openAttachment = (index: number) => {
    setEditMedia(formValue.attachments[index])
    setEditMediaModal(true)
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

  const toggleSchedule = () => {
    if (formValue.scheduled_at) {
      setFormValue(current =>
        Object.assign({}, current, {
          scheduled_at: undefined
        })
      )
    } else {
      setFormValue(current =>
        Object.assign({}, current, {
          scheduled_at: new Date()
        })
      )
    }
  }

  const toggleCW = () => {
    setCW(current => !current)
    setFormValue(current => Object.assign({}, current, { spoiler: '' }))
  }

  const simpleLocale = props.locale ? props.locale.split('-')[0] : 'en'

  const EmojiPicker = forwardRef<HTMLDivElement>((props, ref) => (
    <div ref={ref} {...props} style={{ position: 'absolute' }}>
      <Picker
        data={data}
        custom={customEmojis}
        onEmojiSelect={onEmojiSelect}
        previewPosition="none"
        set="native"
        perLine="7"
        theme={theme === 'high-contrast' ? 'dark' : theme}
        locale={simpleLocale}
      />
    </div>
  ))

  const VisibilityDropdown = ({ onClose, left, top, className }, ref: any) => {
    const handleSelect = (key: string) => {
      onClose()
      if (key === 'public' || key === 'unlisted' || key === 'private' || key === 'direct' || key === 'local') {
        setVisibility(key)
      }
    }
    return (
      <Popover ref={ref} className={className} style={{ left, top }} full>
        <Dropdown.Menu onSelect={handleSelect}>
          <Dropdown.Item eventKey={'public'} icon={<Icon as={BsGlobe} />}>
            <FormattedMessage id="compose.visibility.public" />
          </Dropdown.Item>
          <Dropdown.Item eventKey={'local'} icon={<Icon as={BsPeople} />}>
            <FormattedMessage id="compose.visibility.local" />
          </Dropdown.Item>
          <Dropdown.Item eventKey={'unlisted'} icon={<Icon as={BsUnlock} />}>
            <FormattedMessage id="compose.visibility.unlisted" />
          </Dropdown.Item>
          <Dropdown.Item eventKey={'private'} icon={<Icon as={BsLock} />}>
            <FormattedMessage id="compose.visibility.private" />
          </Dropdown.Item>
          <Dropdown.Item eventKey={'direct'} icon={<Icon as={BsEnvelope} />}>
            <FormattedMessage id="compose.visibility.direct" />
          </Dropdown.Item>
        </Dropdown.Menu>
      </Popover>
    )
  }

  const LanguageDropdown = ({ onClose, left, top, className }, ref: any) => {
    const handleSelect = (key: string) => {
      setLanguage(key)
      localStorage.setItem('language', key)
      onClose()
    }

    return (
      <Popover ref={ref} className={className} style={{ left, top }} full>
        <Dropdown.Menu onSelect={handleSelect} style={{ maxHeight: '300px', overflowX: 'scroll' }}>
          {languages.map((l, index) => (
            <Dropdown.Item key={index} eventKey={l.value}>
              {l.label}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Popover>
    )
  }

  const targetId = () => {
    if (props.in_reply_to) {
      return `emoji-picker-reply-${props.in_reply_to.id}`
    } else if (props.edit_target) {
      return `emoji-picker-edit-${props.edit_target.id}`
    } else {
      return `emoji-picker-compose`
    }
  }

  return (
    <>
      <Form fluid model={model} ref={formRef} onChange={setFormValue} onCheck={setFormError} formValue={formValue}>
        {cw && (
          <Form.Group controlId="spoiler">
            <Form.Control name="spoiler" ref={cwRef} placeholder={formatMessage({ id: 'compose.spoiler.placeholder' })} />
          </Form.Group>
        )}

        <Form.Group controlId="status" style={{ position: 'relative', marginBottom: '4px' }}>
          {/** @ts-ignore **/}
          <Form.Control
            rows={5}
            name="status"
            accepter={Textarea}
            ref={statusRef}
            placeholder={formatMessage({ id: 'compose.status.placeholder' })}
            emojis={customEmojis}
            client={props.client}
            style={{ fontSize: '1em' }}
          />
          {/** delay is required to fix popover position **/}
          <Whisper
            trigger="click"
            placement="bottomEnd"
            controlId={targetId()}
            delay={100}
            preventOverflow={false}
            ref={emojiPickerRef}
            speaker={<EmojiPicker />}
          >
            <Button appearance="link" style={{ position: 'absolute', top: '4px', right: '8px', padding: 0 }}>
              <Icon as={BsEmojiLaughing} style={{ fontSize: '1.2em' }} />
            </Button>
          </Whisper>
          {remaining !== null && (
            <div style={{ display: 'flex', justifyContent: 'flex-end' }}>
              {remaining >= 0 ? (
                <span style={{ color: 'var(--rs-text-tertiary)' }}>{remaining}</span>
              ) : (
                <span style={{ color: 'red' }}>{remaining}</span>
              )}
            </div>
          )}
        </Form.Group>
        {formValue.poll && <Form.Control name="poll" accepter={PollInputControl} fieldError={formError.poll} />}
        {formValue.scheduled_at && <Form.Control name="scheduled_at" accepter={DatePicker} format="yyyy-MM-dd HH:mm" />}

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
            <Button appearance="subtle" onClick={() => toggleCW()}>
              <span style={{ fontSize: '0.8em' }}>CW</span>
            </Button>
            <Whisper placement="bottomEnd" delay={100} trigger="click" speaker={LanguageDropdown} preventOverflow>
              <Button appearance="subtle">
                <span style={{ fontSize: '0.8em' }}>{language.toUpperCase()}</span>
              </Button>
            </Whisper>
            <Button appearance="subtle" onClick={toggleSchedule}>
              <Icon as={BsClock} style={{ fontSize: '1.1em' }} />
            </Button>
          </ButtonToolbar>
        </Form.Group>
        {formValue.attachments?.length > 0 && (
          <Form.Group controlId="nsfw" style={{ marginBottom: '4px' }}>
            <Form.Control
              name="nsfw"
              accepter={Toggle}
              checkedChildren={<FormattedMessage id="compose.nsfw.sensitive" />}
              unCheckedChildren={<FormattedMessage id="compose.nsfw.not_sensitive" />}
            />
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
                <IconButton
                  icon={<Icon as={BsPencil} style={{ fontSize: '1.0em' }} />}
                  appearance="subtle"
                  size="sm"
                  style={{ position: 'absolute', top: 4, right: 4 }}
                  onClick={() => openAttachment(index)}
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
            {(props.in_reply_to || props.edit_target || props.quote_target) && (
              <Button onClick={clear}>
                <FormattedMessage id="compose.cancel" />
              </Button>
            )}
            <Button appearance="primary" onClick={handleSubmit} loading={loading}>
              {postMessage(props.in_reply_to, props.edit_target, props.quote_target)}
            </Button>
          </ButtonToolbar>
        </Form.Group>
      </Form>
      <EditMedia
        opened={editMediaModal}
        attachment={editMedia}
        client={props.client}
        close={() => {
          setEditMedia(null)
          setEditMediaModal(false)
        }}
      />
    </>
  )
}

const privacyIcon = (visibility: 'public' | 'unlisted' | 'private' | 'direct' | 'local') => {
  switch (visibility) {
    case 'public':
      return BsGlobe
    case 'unlisted':
      return BsUnlock
    case 'private':
      return BsLock
    case 'direct':
      return BsEnvelope
    case 'local':
      return BsPeople
    default:
      return BsGlobe
  }
}

const postMessage = (in_reply_to: any, edit_target: any, quote_target: any) => {
  if (in_reply_to) {
    return <FormattedMessage id="compose.reply" />
  } else if (edit_target) {
    return <FormattedMessage id="compose.edit" />
  } else if (quote_target) {
    return <FormattedMessage id="compose.quote" />
  } else {
    return <FormattedMessage id="compose.post" />
  }
}

const Textarea = forwardRef<HTMLTextAreaElement, AutoCompleteTextareaProps>(AutoCompleteTextarea)

const defaultPoll = () => ({
  options: ['', ''],
  expires_in: 86400,
  multiple: false
})

const PollInputControl: FormControlProps<Poll, any> = ({ value, onChange, fieldError }) => {
  const { formatMessage } = useIntl()
  const [poll, setPoll] = useState<Poll>(value)
  const errors = fieldError ? fieldError.object : {}

  const expiresList = [
    { label: formatMessage({ id: 'compose.poll.5min' }), value: 300 },
    { label: formatMessage({ id: 'compose.poll.30min' }), value: 1800 },
    { label: formatMessage({ id: 'compose.poll.1h' }), value: 3600 },
    { label: formatMessage({ id: 'compose.poll.6h' }), value: 21600 },
    { label: formatMessage({ id: 'compose.poll.1d' }), value: 86400 },
    { label: formatMessage({ id: 'compose.poll.3d' }), value: 259200 },
    { label: formatMessage({ id: 'compose.poll.7d' }), value: 604800 }
  ]

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
              checkedChildren={<FormattedMessage id="compose.poll.multiple" />}
              unCheckedChildren={<FormattedMessage id="compose.poll.simple" />}
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
              <FormattedMessage id="compose.poll.add_choice" />
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
