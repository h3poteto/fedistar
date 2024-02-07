import {
  Avatar,
  Container,
  Content,
  FlexboxGrid,
  Header,
  List,
  Whisper,
  Popover,
  Radio,
  RadioGroup,
  Divider,
  Button,
  Loader,
  useToaster
} from 'rsuite'
import { BsBell, BsSliders, BsX, BsChevronLeft, BsChevronRight, BsCheck2, BsArrowClockwise } from 'react-icons/bs'
import { Icon } from '@rsuite/icons'
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'
import { useEffect, useState, forwardRef, useRef, useCallback, Dispatch, SetStateAction } from 'react'
import generator, { MegalodonInterface, Entity } from 'megalodon'
import { Virtuoso } from 'react-virtuoso'

import { Account } from 'src/entities/account'
import { Server } from 'src/entities/server'
import { columnWidth, Timeline } from 'src/entities/timeline'
import Notification from './notification/Notification'
import FailoverImg from 'src/utils/failoverImg'
import { ReceiveNotificationPayload } from 'src/payload'
import { Unread } from 'src/entities/unread'
import { TIMELINE_STATUSES_COUNT, TIMELINE_MAX_STATUSES } from 'src/defaults'
import alert from 'src/components/utils/alert'
import { useRouter } from 'next/router'
import timelineName from 'src/utils/timelineName'
import { Marker } from 'src/entities/marker'
import { FormattedMessage, useIntl } from 'react-intl'

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
  const { formatMessage } = useIntl()
  const [account, setAccount] = useState<Account>()
  const [client, setClient] = useState<MegalodonInterface>()
  const [notifications, setNotifications] = useState<Array<Entity.Notification>>([])
  const [unreadNotifications, setUnreadNotifications] = useState<Array<Entity.Notification>>([])
  const [firstItemIndex, setFirstItemIndex] = useState(TIMELINE_MAX_STATUSES)
  const [loading, setLoading] = useState<boolean>(false)
  const [marker, setMarker] = useState<Marker | null>(null)
  const [pleromaUnreads, setPleromaUnreads] = useState<Array<string>>([])

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
      const cli = generator(props.server.sns, props.server.base_url, account.access_token, 'Fedistar')
      setClient(cli)
      try {
        const res = await loadNotifications(cli)
        setNotifications(res)
      } catch {
        toast.push(alert('error', formatMessage({ id: 'alert.failed_load' }, { timeline: 'notifications' })), { placement: 'topStart' })
      } finally {
        setLoading(false)
      }
      updateMarker(cli)
      listen<ReceiveNotificationPayload>('receive-notification', ev => {
        if (ev.payload.server_id !== props.server.id) {
          return
        }
        updateMarker(cli)
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
    }
    f()
  }, [])

  useEffect(() => {
    if (!replyOpened.current) {
      prependUnreads()
    }
  }, [replyOpened.current])

  useEffect(() => {
    // In pleroma, last_read_id is incorrect.
    // Items that have not been marked may also be read. So, if marker has unread_count, we should use it for unreads.
    if (marker && marker.unread_count) {
      const allNotifications = unreadNotifications.concat(notifications)
      const unreads = allNotifications.slice(0, marker.unread_count).map(n => n.id)
      setPleromaUnreads(unreads)
    }
  }, [marker, unreadNotifications, notifications])

  const loadNotifications = async (client: MegalodonInterface, maxId?: string): Promise<Array<Entity.Notification>> => {
    let options = { limit: TIMELINE_STATUSES_COUNT }
    if (maxId) {
      options = Object.assign({}, options, { max_id: maxId })
    }
    const res = await client.getNotifications(options)
    return res.data.filter(n => !!n.account)
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

  const updateMarker = async (cli: MegalodonInterface) => {
    try {
      const res = await cli.getMarkers(['notifications'])
      const marker = res.data as Entity.Marker
      if (marker.notifications) {
        setMarker(marker.notifications)
      }
    } catch (err) {
      console.error(err)
    }
  }

  const read = async () => {
    props.setUnreads(current => {
      const updated = current.map(u => {
        if (u.server_id === props.server.id) {
          return Object.assign({}, u, { count: 0 })
        }
        return u
      })

      return updated
    })

    // Update maker for server-side
    try {
      await client.saveMarkers({ notifications: { last_read_id: notifications[0].id } })
      if (props.server.sns === 'pleroma') {
        await client.readNotifications({ max_id: notifications[0].id })
      }
      await updateMarker(client)
    } catch {
      toast.push(alert('error', formatMessage({ id: 'alert.failed_mark' })), { placement: 'topStart' })
    }
  }

  const reload = useCallback(async () => {
    try {
      setLoading(true)
      const res = await loadNotifications(client)
      setNotifications(res)
    } catch (err) {
      console.error(err)
      toast.push(alert('error', formatMessage({ id: 'alert.failed_load' }, { timeline: `notifications` })), { placement: 'topStart' })
    } finally {
      setLoading(false)
    }
  }, [client, props.timeline])

  const loadMore = useCallback(async () => {
    console.debug('appending')
    try {
      const append = await loadNotifications(client, notifications[notifications.length - 1].id)
      setNotifications(last => [...last, ...append])
    } catch (err) {
      console.error(err)
    }
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

  const backToTop = () => {
    scrollerRef.current.scrollTo({
      top: 0,
      behavior: 'smooth'
    })
  }

  return (
    <div
      style={{ width: columnWidth(props.timeline.column_width), minWidth: columnWidth(props.timeline.column_width), margin: '0 4px' }}
      className="timeline notifications"
      id={props.timeline.id.toString()}
    >
      <Container style={{ height: '100%' }}>
        <Header style={{ backgroundColor: 'var(--rs-bg-card)' }}>
          <FlexboxGrid align="middle" justify="space-between">
            <FlexboxGrid.Item style={{ width: 'calc(100% - 108px)' }}>
              <FlexboxGrid align="middle" onClick={backToTop} style={{ cursor: 'pointer' }}>
                {/** icon **/}
                <FlexboxGrid.Item
                  style={{
                    lineHeight: '48px',
                    fontSize: '18px',
                    paddingRight: '8px',
                    paddingLeft: '8px',
                    paddingBottom: '6px',
                    width: '42px'
                  }}
                >
                  <Icon as={BsBell} />
                </FlexboxGrid.Item>
                {/** name **/}
                <FlexboxGrid.Item
                  style={{
                    lineHeight: '48px',
                    fontSize: '18px',
                    verticalAlign: 'middle',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: 'calc(100% - 42px)'
                  }}
                  title={timelineName(props.timeline.kind, props.timeline.name, formatMessage) + '@' + props.server.domain}
                >
                  {timelineName(props.timeline.kind, props.timeline.name, formatMessage)}
                  <span style={{ fontSize: '14px', color: 'var(--rs-text-secondary)' }}>@{props.server.domain}</span>
                </FlexboxGrid.Item>
              </FlexboxGrid>
            </FlexboxGrid.Item>
            <FlexboxGrid.Item style={{ width: '108px' }}>
              <FlexboxGrid align="middle" justify="end">
                <FlexboxGrid.Item>
                  <Button
                    appearance="link"
                    title={formatMessage({ id: 'timeline.mark_as_read' })}
                    disabled={props.unreads.find(u => u.server_id === props.server.id && u.count > 0) ? false : true}
                    onClick={read}
                    style={{ padding: '4px' }}
                  >
                    <Icon as={BsCheck2} />
                  </Button>
                </FlexboxGrid.Item>
                <FlexboxGrid.Item>
                  <Button appearance="link" onClick={reload} style={{ padding: '4px' }} title={formatMessage({ id: 'timeline.reload' })}>
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
                    <Button
                      appearance="link"
                      style={{ padding: '4px 8px 4px 4px' }}
                      title={formatMessage({ id: 'timeline.settings.title' })}
                    >
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
            <List hover style={{ width: '100%', height: '100%' }}>
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
                itemContent={(_, notification) => {
                  let shadow = {}
                  if (marker) {
                    if (marker.unread_count && pleromaUnreads.includes(notification.id)) {
                      shadow = { boxShadow: '2px 0 1px var(--rs-primary-700) inset' }
                    } else if (parseInt(marker.last_read_id) < parseInt(notification.id)) {
                      shadow = { boxShadow: '2px 0 1px var(--rs-primary-700) inset' }
                    }
                  }
                  return (
                    <List.Item
                      key={notification.id}
                      style={Object.assign(
                        {
                          paddingTop: '2px',
                          paddingBottom: '2px',
                          backgroundColor: 'var(--rs-bg-card)'
                        },
                        shadow
                      )}
                    >
                      <Notification
                        notification={notification}
                        client={client}
                        server={props.server}
                        account={account}
                        columnWidth={props.timeline.column_width}
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

  const updateColumnWidth = async (timeline: Timeline, columnWidth: string) => {
    await invoke('update_column_width', { id: timeline.id, columnWidth: columnWidth })
    props.close()
  }

  return (
    <Popover ref={ref} style={{ opacity: 1 }}>
      <div style={{ display: 'flex', flexDirection: 'column', width: '220px' }}>
        <label>
          <FormattedMessage id="timeline.settings.column_width" />
        </label>
        <RadioGroup inline value={props.timeline.column_width} onChange={value => updateColumnWidth(props.timeline, value.toString())}>
          <Radio value="xs">xs</Radio>
          <Radio value="sm">sm</Radio>
          <Radio value="md">md</Radio>
          <Radio value="lg">lg</Radio>
        </RadioGroup>
        <Divider style={{ margin: '16px 0' }} />
        <FlexboxGrid justify="space-between">
          <FlexboxGrid.Item>
            <Button appearance="link" size="xs" onClick={() => removeTimeline(props.timeline)}>
              <Icon as={BsX} style={{ paddingBottom: '2px', fontSize: '1.4em' }} />
              <span>
                <FormattedMessage id="timeline.settings.unpin" />
              </span>
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
