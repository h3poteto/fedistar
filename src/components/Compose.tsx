import {
  Container,
  Header,
  Content,
  FlexboxGrid,
  Button,
  Dropdown,
  Avatar,
  Form,
  Input,
  ButtonToolbar,
  Schema,
  Whisper,
  Popover
} from 'rsuite'
import { Icon } from '@rsuite/icons'
import { BsX, BsEmojiLaughing } from 'react-icons/bs'
import { useEffect, useState, forwardRef, useRef } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import generator from 'megalodon'

import { Server } from 'src/entities/server'
import { Account } from 'src/entities/account'
import failoverImg from 'src/utils/failoverImg'
import { data } from 'src/utils/emojiData'
import Picker from '@emoji-mart/react'

const renderAccountIcon = (props: any, ref: any, account: [Account, Server] | undefined) => {
  if (account && account.length > 0) {
    return (
      <FlexboxGrid {...props} ref={ref} align="middle">
        <FlexboxGrid.Item style={{ marginLeft: '12px' }}>
          <Avatar src={failoverImg(account[0].avatar)} alt={account[0].username} size="sm" circle />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item style={{ paddingLeft: '12px' }}>
          @{account[0].username}@{account[1].domain}
        </FlexboxGrid.Item>
      </FlexboxGrid>
    )
  } else {
    return (
      <FlexboxGrid {...props} ref={ref} align="middle">
        <FlexboxGrid.Item>
          <Avatar src={failoverImg('')} />
        </FlexboxGrid.Item>
        <FlexboxGrid.Item>undefined</FlexboxGrid.Item>
      </FlexboxGrid>
    )
  }
}

const Textarea = forwardRef<HTMLTextAreaElement>((props, ref) => <Input {...props} as="textarea" ref={ref} />)

const post = async (account: Account, server: Server, value: FormValue) => {
  const client = generator(server.sns, server.base_url, account.access_token, 'Fedistar')
  const res = await client.postStatus(value.status)
  return res
}

type Props = {
  setOpened: (value: boolean) => void
  servers: Array<Server>
}

type FormValue = {
  status: string
}

const Compose: React.FC<Props> = props => {
  const [accounts, setAccounts] = useState<Array<[Account, Server]>>([])
  const [fromAccount, setFromAccount] = useState<[Account, Server]>()
  const [formValue, setFormValue] = useState<FormValue>({
    status: ''
  })
  const [loading, setLoading] = useState<boolean>(false)

  const formRef = useRef<any>()
  const statusRef = useRef<HTMLDivElement>()

  const model = Schema.Model({
    status: Schema.Types.StringType().isRequired('This field is required.')
  })

  useEffect(() => {
    const f = async () => {
      const accounts = await invoke<Array<[Account, Server]>>('list_accounts')
      setAccounts(accounts)
      setFromAccount(accounts[0])
    }
    f()
  }, [props.servers])

  const selectAccount = (eventKey: string) => {
    const account = accounts[parseInt(eventKey)]
    setFromAccount(account)
  }

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
      await post(fromAccount[0], fromAccount[1], formValue)
      clear()
      setLoading(false)
    }
  }

  const clear = () => {
    setFormValue({
      status: ''
    })
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
    }
  }

  const EmojiPicker = forwardRef<HTMLDivElement>((props, ref) => (
    <Popover ref={ref} {...props}>
      <Picker data={data} onEmojiSelect={onEmojiSelect} previewPosition="none" set="native" perLine="7" />
    </Popover>
  ))

  return (
    <Container>
      <Header style={{ borderBottom: '1px solid var(--rs-divider-border)', backgroundColor: 'var(--rs-sidenav-default-bg)' }}>
        <FlexboxGrid justify="space-between" align="middle">
          <FlexboxGrid.Item style={{ lineHeight: '53px', paddingLeft: '12px', fontSize: '18px' }}>New Status</FlexboxGrid.Item>
          <FlexboxGrid.Item>
            <Button appearance="link" onClick={() => props.setOpened(false)}>
              <Icon as={BsX} style={{ fontSize: '1.4em' }} />
            </Button>
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </Header>
      <Content style={{ height: '100%', margin: '12px' }}>
        <div style={{ fontSize: '1.2em', padding: '12px 0' }}>From</div>
        <FlexboxGrid>
          <FlexboxGrid.Item>
            <Dropdown renderToggle={(props, ref) => renderAccountIcon(props, ref, fromAccount)} onSelect={selectAccount}>
              {accounts.map((account, index) => (
                <Dropdown.Item eventKey={index} key={index}>
                  @{account[0].username}@{account[1].domain}
                </Dropdown.Item>
              ))}
            </Dropdown>
          </FlexboxGrid.Item>
        </FlexboxGrid>
        <div style={{ fontSize: '1.2em', padding: '12px 0' }}>Status</div>
        <Form fluid model={model} ref={formRef} onChange={setFormValue} formValue={formValue}>
          <Form.Group controlId="status" style={{ position: 'relative' }}>
            {/** @ts-ignore **/}
            <Form.Control rows={5} name="status" accepter={Textarea} ref={statusRef} />
            <Whisper trigger="click" placement="bottom" speaker={<EmojiPicker />}>
              <Button appearance="link" style={{ position: 'absolute', top: '4px', right: '8px', padding: 0 }}>
                <Icon as={BsEmojiLaughing} style={{ fontSize: '1.2em' }} />
              </Button>
            </Whisper>
          </Form.Group>
          <Form.Group>
            <ButtonToolbar style={{ textAlign: 'right' }}>
              <Button appearance="primary" type="submit" onClick={handleSubmit} loading={loading}>
                Post
              </Button>
            </ButtonToolbar>
          </Form.Group>
        </Form>
      </Content>
    </Container>
  )
}

export default Compose
