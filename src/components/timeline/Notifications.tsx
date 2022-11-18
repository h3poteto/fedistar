import { Avatar, Container, Content, FlexboxGrid, Header, List, Whisper, Popover, Button, Loader } from 'rsuite'
import { BsBell, BsSliders, BsX, BsChevronLeft, BsChevronRight } from 'react-icons/bs'
import { Icon } from '@rsuite/icons'
import { invoke } from '@tauri-apps/api/tauri'
import { useEffect, useState, forwardRef, useRef } from 'react'
import generator, { detector, MegalodonInterface } from 'megalodon'
import { useVirtualizer } from '@tanstack/react-virtual'
import { Account } from 'src/entities/account'
import { Server } from 'src/entities/server'
import { Timeline } from 'src/entities/timeline'
import Notification from './notification/Notification'
import { listen } from '@tauri-apps/api/event'

type Props = {
  timeline: Timeline
  server: Server
}

type ReceiveNotificationPayload = {
  server_id: number
  notification: Entity.Notification
}

const OptionPopover = forwardRef<HTMLDivElement, { timeline: Timeline; close: () => void }>((props, ref) => {
  const removeTimeline = async (timeline: Timeline) => {
    await invoke<{}>('remove_timeline', { id: timeline.id })
  }

  const switchLeftTimeline = async (timeline: Timeline) => {
    await invoke<{}>('switch_left_timeline', { id: timeline.id })
    props.close()
  }

  const switchRightTimeline = async (timeline: Timeline) => {
    await invoke<{}>('switch_right_timeline', { id: timeline.id })
    props.close()
  }

  return (
    <Popover ref={ref} style={{ opacity: 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: '200px' }}>
        <FlexboxGrid justify="space-between">
          <FlexboxGrid.Item>
            <Button appearance="link" size="xs" onClick={() => removeTimeline(props.timeline)}>
              <Icon as={BsX} size="1.4em" style={{ paddingBottom: '2px' }} />
              <span>Unpin</span>
            </Button>
          </FlexboxGrid.Item>
          <FlexboxGrid.Item>
            <Button appearance="link" size="xs" onClick={() => switchLeftTimeline(props.timeline)}>
              <Icon as={BsChevronLeft} />
            </Button>
            <Button appearance="link" size="xs" onClick={() => switchRightTimeline(props.timeline)}>
              <Icon as={BsChevronRight} />
            </Button>
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </div>
    </Popover>
  )
})

const Notifications: React.FC<Props> = props => {
  const [account, setAccount] = useState<Account>()
  const [client, setClient] = useState<MegalodonInterface>()
  const [notifications, setNotifications] = useState<Array<Entity.Notification>>([])
  const [loading, setLoading] = useState<boolean>(false)

  const parentRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef(null)

  useEffect(() => {
    const f = async () => {
      setLoading(true)
      const account = await invoke<Account>('get_account', { id: props.server.account_id })
      setAccount(account)
      const sns = await detector(props.server.base_url)
      const client = generator(sns, props.server.base_url, account.access_token, 'Fedistar')
      setClient(client)
      try {
        const res = await loadNotifications(client)
        setNotifications(res)
      } finally {
        setLoading(false)
      }
    }
    f()

    listen<ReceiveNotificationPayload>('receive-notification', ev => {
      if (ev.payload.server_id !== props.server.id) {
        return
      }

      setNotifications(last => {
        if (last.find(n => n.id === ev.payload.notification.id)) {
          return last
        }
        return [ev.payload.notification].concat(last)
      })
    })
  }, [])

  const rowVirtualizer = useVirtualizer({ count: notifications.length, estimateSize: () => 125, getScrollElement: () => parentRef.current })

  const loadNotifications = async (client: MegalodonInterface): Promise<Array<Entity.Notification>> => {
    const res = await client.getNotifications({ limit: 40 })
    return res.data
  }

  const closeOptionPopover = () => triggerRef?.current.close()

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
                  <Icon as={BsBell} />
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
                  <Whisper
                    trigger="click"
                    placement="bottomEnd"
                    controlId="option-popover"
                    ref={triggerRef}
                    speaker={<OptionPopover timeline={props.timeline} close={closeOptionPopover} />}
                  >
                    <Button appearance="link">
                      <Icon as={BsSliders} />
                    </Button>
                  </Whisper>
                </FlexboxGrid.Item>
                <FlexboxGrid.Item style={{ paddingRight: '8px' }}>
                  <Avatar circle src={account ? account.avatar : ''} size="xs" />
                </FlexboxGrid.Item>
              </FlexboxGrid>
            </FlexboxGrid.Item>
          </FlexboxGrid>
        </Header>

        {loading ? (
          <Loader style={{ margin: '10rem auto' }} />
        ) : (
          <Content style={{ height: 'calc(100% - 54px)' }}>
            <List hover ref={parentRef} style={{ height: '100%', width: '340px', overflow: 'auto' }}>
              <div style={{ height: rowVirtualizer.getTotalSize(), width: '100%', position: 'relative' }}></div>
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
                  <Notification notification={notifications[virtualRow.index]} />
                </div>
              ))}
            </List>
          </Content>
        )}
      </Container>
    </div>
  )
}

export default Notifications
