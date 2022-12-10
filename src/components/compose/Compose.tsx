import { Container, Header, Content, FlexboxGrid, Button, Dropdown, Avatar } from 'rsuite'
import { Icon } from '@rsuite/icons'
import { BsX } from 'react-icons/bs'
import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import generator, { MegalodonInterface } from 'megalodon'

import { USER_AGENT } from 'src/defaults'
import { Server } from 'src/entities/server'
import { Account } from 'src/entities/account'
import failoverImg from 'src/utils/failoverImg'
import Status from './Status'

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

type Props = {
  setOpened: (value: boolean) => void
  servers: Array<Server>
}

const Compose: React.FC<Props> = props => {
  const [accounts, setAccounts] = useState<Array<[Account, Server]>>([])
  const [fromAccount, setFromAccount] = useState<[Account, Server]>()
  const [client, setClient] = useState<MegalodonInterface>()

  useEffect(() => {
    const f = async () => {
      const accounts = await invoke<Array<[Account, Server]>>('list_accounts')
      setAccounts(accounts)
      setFromAccount(accounts[0])
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

  const selectAccount = (eventKey: string) => {
    const account = accounts[parseInt(eventKey)]
    setFromAccount(account)
  }

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
        {fromAccount && <Status client={client} server={fromAccount[1]} />}
      </Content>
    </Container>
  )
}

export default Compose
