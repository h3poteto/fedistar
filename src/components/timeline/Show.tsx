import { Icon } from '@rsuite/icons'
import { invoke } from '@tauri-apps/api/tauri'
import generator, { Entity, detector, MegalodonInterface } from 'megalodon'
import { useEffect, useState } from 'react'
import { Avatar, Container, Content, FlexboxGrid, Header, List } from 'rsuite'
import { AiOutlineHome, AiOutlineQuestion } from 'react-icons/ai'
import { Account } from 'src/entities/account'
import { Server } from 'src/entities/server'
import { Timeline } from 'src/entities/timeline'
import Status from './status/Status'

type Props = {
  timeline: Timeline
  server: Server
}

const Show: React.FC<Props> = props => {
  const [statuses, setStatuses] = useState<Array<Entity.Status>>([])
  const [account, setAccount] = useState<Account>()
  const [client, setClient] = useState<MegalodonInterface>()

  useEffect(() => {
    const f = async () => {
      const account = await invoke<Account>('get_account', { id: props.server.account_id })
      setAccount(account)
      const sns = await detector(props.server.base_url)
      const client = generator(sns, props.server.base_url, account.access_token, 'Fedistar')
      setClient(client)
      const res = await loadTimeline(props.timeline.timeline, client)
      setStatuses(res)
    }
    f()
  }, [])

  const loadTimeline = async (name: string, client: MegalodonInterface): Promise<Array<Entity.Status>> => {
    switch (name) {
      default:
        const res = await client.getHomeTimeline({ limit: 40 })
        return res.data
    }
  }

  const timelineIcon = (name: string) => {
    switch (name) {
      case 'home':
        return <Icon as={AiOutlineHome} />
      default:
        return <Icon as={AiOutlineQuestion} />
    }
  }

  return (
    <div style={{ width: '340px' }}>
      <Container style={{ height: '100%', overflowY: 'scroll' }}>
        <Header>
          <FlexboxGrid align="middle" justify="space-between">
            <FlexboxGrid.Item>
              <FlexboxGrid align="middle">
                {/** icon **/}
                <FlexboxGrid.Item
                  style={{ lineHeight: '48px', fontSize: '18px', paddingRight: '8px', paddingLeft: '8px', paddingBottom: '6px' }}
                >
                  {timelineIcon(props.timeline.timeline)}
                </FlexboxGrid.Item>
                {/** name **/}
                <FlexboxGrid.Item style={{ lineHeight: '48px', fontSize: '18px' }}>{props.timeline.timeline}</FlexboxGrid.Item>
              </FlexboxGrid>
            </FlexboxGrid.Item>
            <FlexboxGrid.Item>
              <FlexboxGrid align="middle" justify="end">
                <FlexboxGrid.Item style={{ paddingRight: '8px' }}>
                  <Avatar circle src={account ? account.avatar : ''} size="xs" />
                </FlexboxGrid.Item>
              </FlexboxGrid>
            </FlexboxGrid.Item>
          </FlexboxGrid>
        </Header>

        <Content>
          <List hover>
            {statuses.map(status => (
              <Status status={status} key={status.id + status.uri} />
            ))}
          </List>
        </Content>
      </Container>
    </div>
  )
}

export default Show
