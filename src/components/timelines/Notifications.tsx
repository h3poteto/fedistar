import { Avatar, Container, Content, FlexboxGrid, Header, List, Whisper, Popover, Button, Loader, useToaster } from 'rsuite'
import { BsBell, BsSliders, BsX, BsChevronLeft, BsChevronRight, BsCheck2, BsArrowClockwise } from 'react-icons/bs'
import { Icon } from '@rsuite/icons'
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'
import { useEffect, useState, forwardRef, useRef, useCallback, Dispatch, SetStateAction } from 'react'
import generator, { MegalodonInterface } from 'megalodon'
import { Virtuoso } from 'react-virtuoso'

import { Account } from 'src/entities/account'
import { Server } from 'src/entities/server'
import { Timeline } from 'src/entities/timeline'
import Notification from './notification/Notification'
import FailoverImg from 'src/utils/failoverImg'
import { ReceiveNotificationPayload } from 'src/payload'
import { Unread } from 'src/entities/unread'
import { TIMELINE_STATUSES_COUNT, TIMELINE_MAX_STATUSES } from 'src/defaults'
import alert from 'src/components/utils/alert'
import { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'
import timelineName from 'src/utils/timelineName'
import { Marker } from 'src/entities/marker'

type Props = {
  timeline: Timeline
  server: Server
  unreads: Array<Unread>
  setUnreads: Dispatch<SetStateAction<Array<Unread>>>
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
  openReport: (status: Entity.Status, client: MegalodonInterface) => void
  openFromOtherAccount: (status: Entity.Status) => void
}

const Notifications: React.FC<Props> = props => {
  const { t } = useTranslation()

  const [account, setAccount] = useState<Account>()
  const [client, setClient] = useState<MegalodonInterface>()
  const [notifications, setNotifications] = useState<Array<Entity.Notification>>([])
  const [unreadNotifications, setUnreadNotifications] = useState<Array<Entity.Notification>>([])
  const [firstItemIndex, setFirstItemIndex] = useState(TIMELINE_MAX_STATUSES)
  const [loading, setLoading] = useState<boolean>(false)
  const [marker, setMarker] = useState<Marker | null>(null)

  const scrollerRef = useRef<HTMLElement | null>(null)
  const triggerRef = useRef(null)
  const replyOpened = useRef<boolean>(false)
  const toast = useToaster()
  const router = useRouter()

  useEffect(() => {
    const f = async () => {
      setLoading(true)
      const [account, _] = await invoke<[Account, Server]>('get_account', { id: props.server.account_id })
      setAccount(account)
      const client = generator(props.server.sns, props.server.base_url, account.access_token, 'Fedistar')
      setClient(client)
      try {
        const res = await loadNotifications(client)
        setNotifications(res)
      } catch {
        toast.push(alert('error', t('alert.failed_load', { timeline: 'notifications' })), { placement: 'topStart' })
      } finally {
        setLoading(false)
      }
      try {
        const res = await client.getMarkers(['notifications'])
        const marker = res.data as Entity.Marker
        if (marker.notifications) {
          setMarker(marker.notifications)
        }
      } catch (err) {
        console.error(err)
      }
    }
    f()

    listen<ReceiveNotificationPayload>('receive-notification', ev => {
      if (ev.payload.server_id !== props.server.id) {
        return
      }

      if (replyOpened.current || (scrollerRef.current && scrollerRef.current.scrollTop > 10)) {
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

  useEffect(() => {
    if (!replyOpened.current) {
      prependUnreads()
    }
  }, [replyOpened.current])

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

  const setStatusDetail = (statusId: string, serverId: number, accountId?: number) => {
    if (accountId) {
      router.push({ query: { status_id: statusId, server_id: serverId, account_id: accountId } })
    } else {
      router.push({ query: { status_id: statusId, server_id: serverId } })
    }
  }

  const setAccountDetail = (userId: string, serverId: number, accountId?: number) => {
    if (accountId) {
      router.push({ query: { user_id: userId, server_id: serverId, account_id: accountId } })
    } else {
      router.push({ query: { user_id: userId, server_id: serverId } })
    }
  }

  const setTagDetail = (tag: string, serverId: number, accountId?: number) => {
    if (accountId) {
      router.push({ query: { tag: tag, server_id: serverId, account_id: accountId } })
    } else {
      router.push({ query: { tag: tag, server_id: serverId } })
    }
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
    try {
      await client.saveMarkers({ notifications: { last_read_id: notifications[0].id } })
      if (props.server.sns === 'pleroma') {
        await client.readNotifications({ max_id: notifications[0].id })
      }
      const res = await client.getMarkers(['notifications'])
      const marker = res.data as Entity.Marker
      if (marker.notifications) {
        setMarker(marker.notifications)
      }
    } catch {
      toast.push(alert('error', t('falert.failed_mark')), { placement: 'topStart' })
    }
  }

  const reload = useCallback(async () => {
    try {
      setLoading(true)
      const res = await loadNotifications(client)
      setNotifications(res)
    } catch (err) {
      console.error(err)
      toast.push(alert('error', t('alert.failed_load', { timeline: `notifications` })), { placement: 'topStart' })
    } finally {
      setLoading(false)
    }
  }, [client, props.timeline])

  const loadMore = useCallback(async () => {
    console.debug('appending')
    const append = await loadNotifications(client, notifications[notifications.length - 1].id)
    setNotifications(last => [...last, ...append])
  }, [client, notifications, setNotifications])

  const prependUnreads = useCallback(() => {
    console.debug('prepending')
    const unreads = unreadNotifications.slice().reverse().slice(0, TIMELINE_STATUSES_COUNT).reverse()
    const remains = unreadNotifications.slice(0, -1 * TIMELINE_STATUSES_COUNT)
    setUnreadNotifications(() => remains)
    setFirstItemIndex(() => firstItemIndex - unreads.length)
    setNotifications(() => [...unreads, ...notifications])
    return false
  }, [firstItemIndex, notifications, setNotifications, unreadNotifications])

  return (
    <div
      style={{ width: '340px', minWidth: '340px', margin: '0 4px' }}
      className="timeline notifications"
      id={props.timeline.id.toString()}
    >
      <Container style={{ height: '100%' }}>
        <Header style={{ backgroundColor: 'var(--rs-gray-800)' }}>
          <FlexboxGrid align="middle" justify="space-between">
            <FlexboxGrid.Item colspan={16}>
              <FlexboxGrid align="middle">
                {/** icon **/}
                <FlexboxGrid.Item
                  colspan={4}
                  style={{ lineHeight: '48px', fontSize: '18px', paddingRight: '8px', paddingLeft: '8px', paddingBottom: '6px' }}
                >
                  <Icon as={BsBell} />
                </FlexboxGrid.Item>
                {/** name **/}
                <FlexboxGrid.Item
                  colspan={20}
                  style={{
                    lineHeight: '48px',
                    fontSize: '18px',
                    verticalAlign: 'middle',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap'
                  }}
                  title={timelineName(props.timeline.kind, props.timeline.name, t) + '@' + props.server.domain}
                >
                  {timelineName(props.timeline.kind, props.timeline.name, t)}
                  <span style={{ fontSize: '14px', color: 'var(--rs-text-secondary)' }}>@{props.server.domain}</span>
                </FlexboxGrid.Item>
              </FlexboxGrid>
            </FlexboxGrid.Item>
            <FlexboxGrid.Item colspan={8}>
              <FlexboxGrid align="middle" justify="end">
                <FlexboxGrid.Item>
                  <Button
                    appearance="link"
                    title={t('timeline.mark_as_read')}
                    disabled={props.unreads.find(u => u.server_id === props.server.id && u.count > 0) ? false : true}
                    onClick={read}
                    style={{ padding: '4px' }}
                  >
                    <Icon as={BsCheck2} />
                  </Button>
                </FlexboxGrid.Item>
                <FlexboxGrid.Item>
                  <Button appearance="link" onClick={reload} style={{ padding: '4px' }} title={t('timeline.reload')}>
                    <Icon as={BsArrowClockwise} />
                  </Button>
                </FlexboxGrid.Item>
                <FlexboxGrid.Item>
                  <Whisper
                    trigger="click"
                    placement="bottomEnd"
                    controlId="option-popover"
                    ref={triggerRef}
                    speaker={<OptionPopover timeline={props.timeline} close={closeOptionPopover} />}
                  >
                    <Button appearance="link" style={{ padding: '4px 8px 4px 4px' }} title={t('timeline.settings.title')}>
                      <Icon as={BsSliders} />
                    </Button>
                  </Whisper>
                </FlexboxGrid.Item>
                <FlexboxGrid.Item style={{ paddingRight: '8px', height: '20px' }}>
                  <Avatar circle src={FailoverImg(account ? account.avatar : null)} size="xs" title={account ? account.username : ''} />
                </FlexboxGrid.Item>
              </FlexboxGrid>
            </FlexboxGrid.Item>
          </FlexboxGrid>
        </Header>

        {loading ? (
          <Loader style={{ margin: '10em auto' }} />
        ) : (
          <Content style={{ height: 'calc(100% - 54px)' }}>
            <List hover style={{ width: '340px', height: '100%' }}>
              <Virtuoso
                style={{ height: '100%' }}
                data={notifications}
                scrollerRef={ref => {
                  scrollerRef.current = ref as HTMLElement
                }}
                className="timeline-scrollable"
                firstItemIndex={firstItemIndex}
                atTopStateChange={prependUnreads}
                endReached={loadMore}
                overscan={TIMELINE_STATUSES_COUNT}
                itemContent={(index, notification) => {
                  let shadow = {}
                  if (marker && (parseInt(marker.last_read_id) < parseInt(notification.id) || index < marker.unread_count)) {
                    shadow = { boxShadow: '2px 0 1px var(--rs-primary-700) inset' }
                  }
                  return (
                    <List.Item
                      key={notification.id}
                      style={Object.assign(
                        {
                          paddingTop: '2px',
                          paddingBottom: '2px',
                          backgroundColor: 'var(--rs-gray-800)'
                        },
                        shadow
                      )}
                    >
                      <Notification
                        notification={notification}
                        client={client}
                        server={props.server}
                        account={account}
                        updateStatus={updateStatus}
                        openMedia={props.openMedia}
                        setReplyOpened={opened => (replyOpened.current = opened)}
                        setStatusDetail={setStatusDetail}
                        setAccountDetail={setAccountDetail}
                        setTagDetail={setTagDetail}
                        openReport={props.openReport}
                        openFromOtherAccount={props.openFromOtherAccount}
                      />
                    </List.Item>
                  )
                }}
              />
            </List>
          </Content>
        )}
      </Container>
    </div>
  )
}

const OptionPopover = forwardRef<HTMLDivElement, { timeline: Timeline; close: () => void }>((props, ref) => {
  const { t } = useTranslation()

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
              <span>{t('timeline.settings.unpin')}</span>
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

export default Notifications
