import { Icon } from '@rsuite/icons'
import { BsX } from 'react-icons/bs'
import { FormattedMessage } from 'react-intl'
import { Button, Container, Content, FlexboxGrid, Header, Dropdown } from 'rsuite'
import { Server, ServerSet } from 'src/entities/server'
import { renderAccountIcon } from '../compose/Compose'
import { useState, useEffect } from 'react'
import { Account } from 'src/entities/account'
import { invoke } from '@tauri-apps/api/tauri'
import generator, { MegalodonInterface } from 'megalodon'
import { USER_AGENT } from 'src/defaults'
import Results from './Results'

type Props = {
  setOpened: (value: boolean) => void
  servers: Array<ServerSet>
}

export default function Search(props: Props) {
  const [accounts, setAccounts] = useState<Array<[Account, Server]>>([])
  const [fromAccount, setFromAccount] = useState<[Account, Server]>()
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
  }, [fromAccount])

  const selectAccount = async (eventKey: string) => {
    const account = accounts[parseInt(eventKey)]
    setFromAccount(account)
    await invoke('set_usual_account', { id: account[0].id })
  }

  return (
    <Container style={{ backgroundColor: 'var(--rs-border-secondary)', height: '100%' }}>
      <Header style={{ borderBottom: '1px solid var(--rs-divider-border)', backgroundColor: 'var(--rs-state-hover-bg)' }}>
        <FlexboxGrid justify="space-between" align="middle">
          <FlexboxGrid.Item style={{ lineHeight: '53px', paddingLeft: '12px', fontSize: '18px' }}>
            <FormattedMessage id="search.title" />
          </FlexboxGrid.Item>
          <FlexboxGrid.Item>
            <Button appearance="link" onClick={() => props.setOpened(false)}>
              <Icon as={BsX} style={{ fontSize: '1.4em' }} />
            </Button>
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </Header>
      <Content style={{ height: '100%', margin: '12px', backgroundColor: 'var(--rs-border-secondary)' }}>
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
        {fromAccount && <Results client={client} server={fromAccount[1]} />}
      </Content>
    </Container>
  )
}
