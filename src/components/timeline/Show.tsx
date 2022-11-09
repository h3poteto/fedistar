import { Icon } from '@rsuite/icons'
import { invoke } from '@tauri-apps/api/tauri'
import generator, { Entity, detector, MegalodonInterface } from 'megalodon'
import { useEffect, useRef, useState } from 'react'
import { Avatar, Container, Content, FlexboxGrid, Header, List } from 'rsuite'
import { BsHouseDoor, BsPeople, BsQuestion } from 'react-icons/bs'
import { useVirtualizer } from '@tanstack/react-virtual'
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

  const parentRef = useRef<HTMLDivElement>(null)

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

  const rowVirtualizer = useVirtualizer({ count: statuses.length, estimateSize: () => 125, getScrollElement: () => parentRef.current })

  const loadTimeline = async (name: string, client: MegalodonInterface): Promise<Array<Entity.Status>> => {
    switch (name) {
      case 'home': {
        const res = await client.getHomeTimeline({ limit: 40 })
        return res.data
      }
      case 'local': {
        const res = await client.getLocalTimeline({ limit: 40 })
        return res.data
      }
      default:
        return []
    }
  }

  const timelineIcon = (name: string) => {
    switch (name) {
      case 'home':
        return <Icon as={BsHouseDoor} />
      case 'local':
        return <Icon as={BsPeople} />
      default:
        return <Icon as={BsQuestion} />
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
                <FlexboxGrid.Item style={{ lineHeight: '48px', fontSize: '18px', verticalAlign: 'middle' }}>
                  {props.timeline.timeline}
                  <span style={{ fontSize: '14px' }}>@{props.server.domain}</span>
                </FlexboxGrid.Item>
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

        <Content style={{ height: 'calc(100% - 54px)' }}>
          <List
            hover
            ref={parentRef}
            style={{
              height: '100%',
              width: '340px',
              overflow: 'auto'
            }}
          >
            <div
              style={{
                height: rowVirtualizer.getTotalSize(),
                width: '100%',
                position: 'relative'
              }}
            >
              {rowVirtualizer.getVirtualItems().map(virtualRow => (
                <div
                  key={virtualRow.key}
                  data-index={virtualRow.index}
                  ref={rowVirtualizer.measureElement}
                  className={virtualRow.index % 2 ? 'ListItemOdd' : 'ListItemEven'}
                  style={{
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    transform: `translateY(${virtualRow.start}px)`
                  }}
                >
                  <Status status={statuses[virtualRow.index]} />
                </div>
              ))}
            </div>
          </List>
        </Content>
      </Container>
    </div>
  )
}

export default Show
