import { Container, Header, Content, Button, Dropdown, Avatar } from 'rsuite'
import { Icon } from '@rsuite/icons'
import { BsX } from 'react-icons/bs'
import { useEffect, useState } from 'react'
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
      <div style={{ display: 'flex', alignItems: 'center' }} {...props} ref={ref}>
        <div style={{ marginLeft: '12px' }}>
          <Avatar src={failoverImg(account[0].avatar)} alt={account[0].username} size="sm" circle />
        </div>
        <div style={{ paddingLeft: '12px' }}>
          @{account[0].username}@{account[1].domain}
        </div>
      </div>
    )
  } else {
    return (
      <div style={{ display: 'flex', alignItems: 'center' }} {...props} ref={ref}>
        <div>
          <Avatar src={failoverImg('')} />
        </div>
        <div>undefined</div>
      </div>
    )
  }
}

type Props = {
  setOpened: (value: boolean) => void
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

  return (
    <Container style={{ backgroundColor: 'var(--rs-border-secondary)', height: '100%', overflowY: 'auto' }}>
      <Header style={{ borderBottom: '1px solid var(--rs-divider-border)', backgroundColor: 'var(--rs-border-secondary)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ lineHeight: '53px', paddingLeft: '12px', fontSize: '18px' }}>
            <FormattedMessage id="compose.title" />
          </div>
          <div>
            <Button appearance="link" onClick={() => props.setOpened(false)}>
              <Icon as={BsX} style={{ fontSize: '1.4em' }} />
            </Button>
          </div>
        </div>
      </Header>
      <Content style={{ height: '100%', margin: '12px', backgroundColor: 'var(--rs-border-secondary)' }}>
        <div style={{ fontSize: '1.2em', padding: '12px 0' }}>
          <FormattedMessage id="compose.from" />
        </div>
        <div style={{ display: 'flex' }}>
          <div>
            <Dropdown renderToggle={(props, ref) => renderAccountIcon(props, ref, fromAccount)} onSelect={selectAccount}>
              {accounts.map((account, index) => (
                <Dropdown.Item eventKey={index} key={index}>
                  @{account[0].username}@{account[1].domain}
                </Dropdown.Item>
              ))}
            </Dropdown>
          </div>
        </div>
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
          />
        )}
      </Content>
    </Container>
  )
}

export default Compose
