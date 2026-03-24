import { Container, Header, Content, FlexboxGrid, Dropdown, Avatar } from 'rsuite'
import { DragEventHandler, useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import generator, { MegalodonInterface } from 'megalodon'

import { USER_AGENT } from 'src/defaults'
import { Server, ServerSet } from 'src/entities/server'
import { Account } from 'src/entities/account'
import failoverImg from 'src/utils/failoverImg'
import Status from './Status'
import { FormattedMessage } from 'react-intl'

export const renderAccountIcon = (props: any, ref: any, account: [Account, Server] | undefined) => {
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

type Props = {
  servers: Array<ServerSet>
  locale: string
}

const Compose: React.FC<Props> = props => {
  const [accounts, setAccounts] = useState<Array<[Account, Server]>>([])
  const [fromAccount, setFromAccount] = useState<[Account, Server]>()
  const [defaultVisibility, setDefaultVisibility] = useState<'public' | 'unlisted' | 'private' | 'direct' | 'local'>('public')
  const [defaultNSFW, setDefaultNSFW] = useState(false)
  const [defaultLanguage, setDefaultLanguage] = useState<string | null>(null)
  const [client, setClient] = useState<MegalodonInterface>()
  const [draggingAttachment, setDraggingAttachment] = useState(false)
  const [attachmentDropHandler, setAttachmentDropHandler] = useState<((files: Array<File>) => Promise<void>) | null>(null)
  const [dragDepth, setDragDepth] = useState(0)

  useEffect(() => {
    const f = async () => {
      const accounts = await invoke<Array<[Account, Server]>>('list_accounts')
      setAccounts(accounts)

      const usual = accounts.find(([a, _]) => a.usual)
      if (usual) {
        setFromAccount(usual)
      } else {
        setFromAccount(accounts[0])
      }
    }
    f()
  }, [props.servers])

  useEffect(() => {
    if (!fromAccount || fromAccount.length < 2) {
      return
    }
    const client = generator(fromAccount[1].sns, fromAccount[1].base_url, fromAccount[0].access_token, USER_AGENT)
    setClient(client)
    const f = async () => {
      const res = await client.verifyAccountCredentials()
      if (res.data.source) {
        setDefaultVisibility(res.data.source.privacy as 'public' | 'unlisted' | 'private' | 'direct' | 'local')
        setDefaultNSFW(res.data.source.sensitive)
        setDefaultLanguage(res.data.source.language)
      }
    }
    f()
  }, [fromAccount])

  const selectAccount = async (eventKey: string) => {
    const account = accounts[parseInt(eventKey)]
    setFromAccount(account)
    await invoke('set_usual_account', { id: account[0].id })
  }

  const hasDraggedFiles = (dataTransfer: DataTransfer) => {
    if (dataTransfer.files.length > 0) {
      return true
    }

    if (Array.from(dataTransfer.items ?? []).some(item => item.kind === 'file')) {
      return true
    }

    return Array.from(dataTransfer.types).some(type => type === 'Files' || type === 'public.file-url')
  }

  const attachmentDragEnter: DragEventHandler<HTMLDivElement> = event => {
    if (!hasDraggedFiles(event.dataTransfer)) {
      return
    }

    event.preventDefault()
    setDragDepth(current => current + 1)
    setDraggingAttachment(true)
  }

  const attachmentDragOver: DragEventHandler<HTMLDivElement> = event => {
    if (!hasDraggedFiles(event.dataTransfer)) {
      return
    }

    event.preventDefault()
    event.dataTransfer.dropEffect = 'copy'
  }

  const attachmentDragLeave: DragEventHandler<HTMLDivElement> = event => {
    if (!hasDraggedFiles(event.dataTransfer)) {
      return
    }

    event.preventDefault()
    setDragDepth(current => {
      const nextDepth = Math.max(0, current - 1)
      if (nextDepth === 0) {
        setDraggingAttachment(false)
      }
      return nextDepth
    })
  }

  const attachmentDropped: DragEventHandler<HTMLDivElement> = async event => {
    if (!hasDraggedFiles(event.dataTransfer)) {
      return
    }

    event.preventDefault()
    setDragDepth(0)
    setDraggingAttachment(false)
    const files =
      event.dataTransfer.files.length > 0
        ? Array.from(event.dataTransfer.files)
        : Array.from(event.dataTransfer.items)
            .filter(item => item.kind === 'file')
            .map(item => item.getAsFile())
            .filter((file): file is File => file !== null)

    if (files.length === 0 || !attachmentDropHandler) {
      return
    }

    await attachmentDropHandler(files)
  }

  return (
    <Container style={{ backgroundColor: 'var(--rs-border-secondary)', height: '100%', overflowY: 'auto' }}>
      <Header style={{ borderBottom: '1px solid var(--rs-divider-border)', backgroundColor: 'var(--rs-border-secondary)' }}>
        <FlexboxGrid align="middle">
          <FlexboxGrid.Item style={{ lineHeight: '53px', paddingLeft: '12px', fontSize: '18px' }}>
            <FormattedMessage id="compose.title" />
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </Header>
      <Content
        className={draggingAttachment ? 'compose-dropzone dragging' : 'compose-dropzone'}
        style={{ height: '100%', margin: '12px', backgroundColor: 'var(--rs-border-secondary)' }}
        onDragEnter={attachmentDragEnter}
        onDragOver={attachmentDragOver}
        onDragLeave={attachmentDragLeave}
        onDrop={attachmentDropped}
      >
        <div style={{ fontSize: '1.2em', padding: '12px 0' }}>
          <FormattedMessage id="compose.from" />
        </div>
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
        <div style={{ fontSize: '1.2em', padding: '12px 0' }}>
          <FormattedMessage id="compose.status.title" />
        </div>
        {fromAccount && (
          <Status
            client={client}
            server={fromAccount[1]}
            account={fromAccount[0]}
            defaultVisibility={defaultVisibility}
            defaultNSFW={defaultNSFW}
            defaultLanguage={defaultLanguage}
            locale={props.locale}
            draggingAttachment={draggingAttachment}
            setAttachmentDropHandler={setAttachmentDropHandler}
          />
        )}
      </Content>
    </Container>
  )
}

export default Compose
