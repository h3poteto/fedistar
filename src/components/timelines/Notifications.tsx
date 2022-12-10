import { Avatar, Container, Content, FlexboxGrid, Header, List, Whisper, Popover, Button, Loader, useToaster, Message } from 'rsuite'
import { BsBell, BsSliders, BsX, BsChevronLeft, BsChevronRight, BsCheck2 } from 'react-icons/bs'
import { Icon } from '@rsuite/icons'
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'
import { useEffect, useState, forwardRef, useRef, useCallback } from 'react'
import generator, { MegalodonInterface } from 'megalodon'
import { Virtuoso } from 'react-virtuoso'

import { Account } from 'src/entities/account'
import { Server } from 'src/entities/server'
import { Timeline } from 'src/entities/timeline'
import Notification from './notification/Notification'
import { ReceiveNotificationPayload } from 'src/payload'
import { Unread } from 'src/entities/unread'
import { TIMELINE_STATUSES_COUNT, TIMELINE_MAX_STATUSES } from 'src/defaults'

type Props = {
  timeline: Timeline
  server: Server
  unreads: Array<Unread>
  setUnreads: (a: Array<Unread>) => void
  openMedia: (media: Entity.Attachment) => void
}

const Notifications: React.FC<Props> = props => {
  const [account, setAccount] = useState<Account>()
  const [client, setClient] = useState<MegalodonInterface>()
  const [notifications, setNotifications] = useState<Array<Entity.Notification>>([])
  const [unreadNotifications, setUnreadNotifications] = useState<Array<Entity.Notification>>([])
  const [firstItemIndex, setFirstItemIndex] = useState(TIMELINE_MAX_STATUSES)
  const [loading, setLoading] = useState<boolean>(false)

  const scrollerRef = useRef<HTMLElement | null>(null)
  const triggerRef = useRef(null)
  const toast = useToaster()

  useEffect(() => {
    const f = async () => {
      setLoading(true)
      const account = await invoke<Account>('get_account', { id: props.server.account_id })
      setAccount(account)
      const client = generator(props.server.sns, props.server.base_url, account.access_token, 'Fedistar')
      setClient(client)
      try {
        const res = await loadNotifications(client)
        setNotifications(res)
      } catch {
        toast.push(alert('error', 'Failed to load notifications'), { placement: 'topStart' })
      } finally {
        setLoading(false)
      }
    }
    f()

    listen<ReceiveNotificationPayload>('receive-notification', ev => {
      if (ev.payload.server_id !== props.server.id) {
        return
      }

      if (scrollerRef.current && scrollerRef.current.scrollTop > 10) {
        setUnreadNotifications(last => {
          if (last.find(n => n.id === ev.payload.notification.id)) {
            return last
          }
          return [ev.payload.notification].concat(last)
        })
        return
      }

      setNotifications(last => {
        if (last.find(n => n.id === ev.payload.notification.id)) {
          return last
        }
        return [ev.payload.notification].concat(last).slice(0, TIMELINE_STATUSES_COUNT)
      })
    })
  }, [])

  const loadNotifications = async (client: MegalodonInterface, maxId?: string): Promise<Array<Entity.Notification>> => {
    let options = { limit: TIMELINE_STATUSES_COUNT }
    if (maxId) {
      options = Object.assign({}, options, { max_id: maxId })
    }
    const res = await client.getNotifications(options)
    return res.data
  }

  const closeOptionPopover = () => triggerRef?.current.close()

  const updateStatus = (status: Entity.Status) => {
    const renew = notifications.map(n => {
      if (n.status === undefined || n.status === null) {
        return n
      }
      if (n.status.id === status.id) {
        return Object.assign({}, n, { status })
      } else if (n.status.reblog && n.status.reblog.id === status.id) {
        const s = Object.assign({}, n.status, { reblog: status })
        return Object.assign({}, n, { status: s })
      }
      return n
    })
    setNotifications(renew)
  }

  const read = async () => {
    props.setUnreads(
      props.unreads.map(u => {
        if (u.server_id === props.server.id) {
          return Object.assign({}, u, { count: 0 })
        }
        return u
      })
    )

    // Update maker for server-side
    await client.saveMarkers({ notifications: { last_read_id: notifications[0].id } })
    if (props.server.sns === 'pleroma') {
      await client.readNotifications({ max_id: notifications[0].id })
    }
  }

  const loadMore = useCallback(async () => {
    console.debug('appending')
    const append = await loadNotifications(client, notifications[notifications.length - 1].id)
    setNotifications(last => [...last, ...append])
  }, [client, notifications, setNotifications])

  const prependUnreads = useCallback(() => {
    console.debug('prepending')
    const unreads = unreadNotifications.slice().reverse().slice(0, TIMELINE_STATUSES_COUNT)
    const remains = unreadNotifications.slice(0, -1 * TIMELINE_STATUSES_COUNT)
    setUnreadNotifications(() => remains)
    setFirstItemIndex(() => firstItemIndex - unreads.length)
    setNotifications(() => [...unreads, ...notifications])
    return false
  }, [firstItemIndex, notifications, setNotifications, unreadNotifications])

  return (
    <div style={{ width: '340px', minWidth: '340px' }}>
      <Container style={{ height: 'calc(100% - 8px)', overflowY: 'scroll' }}>
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
                  <span style={{ fontSize: '14px', color: 'var(--rs-text-secondary)' }}>@{props.server.domain}</span>
                </FlexboxGrid.Item>
              </FlexboxGrid>
            </FlexboxGrid.Item>
            <FlexboxGrid.Item>
              <FlexboxGrid align="middle" justify="end">
                <FlexboxGrid.Item>
                  <Button
                    appearance="link"
                    title="Mark as read"
                    disabled={props.unreads.find(u => u.server_id === props.server.id && u.count > 0) ? false : true}
                    onClick={read}
                  >
                    <Icon as={BsCheck2} />
                  </Button>
                </FlexboxGrid.Item>
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
            <List hover style={{ width: '340px', height: '100%' }}>
              <Virtuoso
                style={{ height: '100%' }}
                data={notifications}
                scrollerRef={ref => {
                  scrollerRef.current = ref as HTMLElement
                }}
                firstItemIndex={firstItemIndex}
                atTopStateChange={prependUnreads}
                endReached={loadMore}
                overscan={TIMELINE_STATUSES_COUNT}
                itemContent={(_, notification) => (
                  <div key={notification.id}>
                    <Notification
                      notification={notification}
                      client={client}
                      server={props.server}
                      updateStatus={updateStatus}
                      openMedia={props.openMedia}
                    />
                  </div>
                )}
              />
            </List>
          </Content>
        )}
      </Container>
    </div>
  )
}

const OptionPopover = forwardRef<HTMLDivElement, { timeline: Timeline; close: () => void }>((props, ref) => {
  const removeTimeline = async (timeline: Timeline) => {
    await invoke('remove_timeline', { id: timeline.id })
  }

  const switchLeftTimeline = async (timeline: Timeline) => {
    await invoke('switch_left_timeline', { id: timeline.id })
    props.close()
  }

  const switchRightTimeline = async (timeline: Timeline) => {
    await invoke('switch_right_timeline', { id: timeline.id })
    props.close()
  }

  return (
    <Popover ref={ref} style={{ opacity: 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: '200px' }}>
        <FlexboxGrid justify="space-between">
          <FlexboxGrid.Item>
            <Button appearance="link" size="xs" onClick={() => removeTimeline(props.timeline)}>
              <Icon as={BsX} style={{ paddingBottom: '2px', fontSize: '1.4em' }} />
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

const alert = (type: 'info' | 'success' | 'warning' | 'error', message: string) => (
  <Message showIcon type={type}>
    {message}
  </Message>
)

export default Notifications
