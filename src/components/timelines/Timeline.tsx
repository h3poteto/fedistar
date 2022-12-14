import { Icon } from '@rsuite/icons'
import { invoke } from '@tauri-apps/api/tauri'
import generator, { Entity, MegalodonInterface } from 'megalodon'
import { useEffect, useRef, useState, forwardRef, useCallback } from 'react'
import { Avatar, Container, Content, FlexboxGrid, Header, List, Whisper, Popover, Button, Loader, useToaster } from 'rsuite'
import {
  BsHouseDoor,
  BsPeople,
  BsGlobe2,
  BsSliders,
  BsX,
  BsChevronLeft,
  BsChevronRight,
  BsStar,
  BsListUl,
  BsBookmark
} from 'react-icons/bs'
import { listen } from '@tauri-apps/api/event'
import { Virtuoso } from 'react-virtuoso'
import parse from 'parse-link-header'

import { Account } from 'src/entities/account'
import { Server } from 'src/entities/server'
import { Timeline, TimelineKind } from 'src/entities/timeline'
import Status from './status/Status'
import FailoverImg from 'src/utils/failoverImg'
import { DeleteHomeStatusPayload, DeleteTimelineStatusPayload, ReceiveHomeStatusPayload, ReceiveTimelineStatusPayload } from 'src/payload'
import { TIMELINE_STATUSES_COUNT, TIMELINE_MAX_STATUSES } from 'src/defaults'
import alert from 'src/components/utils/alert'

type Props = {
  timeline: Timeline
  server: Server
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
  setStatusDetail: (status: Entity.Status, server: Server, client: MegalodonInterface) => void
  setAccountDetail: (account: Entity.Account, server: Server, client: MegalodonInterface) => void
}

const Timeline: React.FC<Props> = props => {
  const [statuses, setStatuses] = useState<Array<Entity.Status>>([])
  const [unreadStatuses, setUnreadStatuses] = useState<Array<Entity.Status>>([])
  const [firstItemIndex, setFirstItemIndex] = useState(TIMELINE_MAX_STATUSES)
  const [account, setAccount] = useState<Account | null>(null)
  const [client, setClient] = useState<MegalodonInterface>()
  const [loading, setLoading] = useState<boolean>(false)
  // This parameter is used only favourite. Because it is not receive streaming, and max_id in link header is required for favourite.
  const [nextMaxId, setNextMaxId] = useState<string | null>(null)

  const scrollerRef = useRef<HTMLElement | null>(null)
  const triggerRef = useRef(null)
  const replyOpened = useRef<boolean>(false)
  const toast = useToaster()

  useEffect(() => {
    const f = async () => {
      setLoading(true)
      let client: MegalodonInterface
      if (props.server.account_id) {
        const account = await invoke<Account>('get_account', { id: props.server.account_id })
        setAccount(account)
        client = generator(props.server.sns, props.server.base_url, account.access_token, 'Fedistar')
        setClient(client)
      } else {
        client = generator(props.server.sns, props.server.base_url, undefined, 'Fedistar')
        setClient(client)
      }
      try {
        const res = await loadTimeline(props.timeline, client)
        setStatuses(res)
      } catch (err) {
        console.error(err)
        toast.push(alert('error', `Failed to load ${props.timeline.name} timeline`), { placement: 'topStart' })
      } finally {
        setLoading(false)
      }
    }
    f()

    if (props.timeline.kind === 'home') {
      listen<ReceiveHomeStatusPayload>('receive-home-status', ev => {
        if (ev.payload.server_id !== props.server.id) {
          return
        }

        if (replyOpened.current || (scrollerRef.current && scrollerRef.current.scrollTop > 10)) {
          setUnreadStatuses(last => prependStatus(last, ev.payload.status))
          return
        }

        setStatuses(last => appendStatus(last, ev.payload.status))
      })

      listen<DeleteHomeStatusPayload>('delete-home-status', ev => {
        if (ev.payload.server_id !== props.server.id) {
          return
        }
        setUnreadStatuses(last => deleteStatus(last, ev.payload.status_id))
        setStatuses(last => deleteStatus(last, ev.payload.status_id))
      })
    } else {
      listen<ReceiveTimelineStatusPayload>('receive-timeline-status', ev => {
        if (ev.payload.timeline_id !== props.timeline.id) {
          return
        }

        if (replyOpened.current || (scrollerRef.current && scrollerRef.current.scrollTop > 10)) {
          setUnreadStatuses(last => prependStatus(last, ev.payload.status))
          return
        }

        setStatuses(last => appendStatus(last, ev.payload.status))
      })

      listen<DeleteTimelineStatusPayload>('delete-timeline-status', ev => {
        if (ev.payload.timeline_id !== props.timeline.id) {
          return
        }
        setUnreadStatuses(last => deleteStatus(last, ev.payload.status_id))
        setStatuses(last => deleteStatus(last, ev.payload.status_id))
      })
    }
  }, [])

  useEffect(() => {
    if (!replyOpened.current) {
      prependUnreads()
    }
  }, [replyOpened.current])

  const loadTimeline = async (tl: Timeline, client: MegalodonInterface, maxId?: string): Promise<Array<Entity.Status>> => {
    let options = { limit: TIMELINE_STATUSES_COUNT }
    if (maxId) {
      options = Object.assign({}, options, { max_id: maxId })
    }
    switch (tl.kind) {
      case 'home': {
        const res = await client.getHomeTimeline(options)
        return res.data
      }
      case 'local': {
        const res = await client.getLocalTimeline(options)
        return res.data
      }
      case 'public': {
        const res = await client.getPublicTimeline(options)
        return res.data
      }
      case 'favourites': {
        const res = await client.getFavourites(options)
        const link = parse(res.headers.link)
        if (link !== null && link.next) {
          setNextMaxId(link.next.max_id)
        }
        return res.data
      }
      case 'list': {
        if (tl.list_id) {
          const res = await client.getListTimeline(tl.list_id, options)
          return res.data
        }
        return []
      }
      case 'bookmarks': {
        const res = await client.getBookmarks(options)
        const link = parse(res.headers.link)
        if (link !== null && link.next) {
          setNextMaxId(link.next.max_id)
        }
        return res.data
      }
      default:
    }
  }

  const timelineIcon = (kind: TimelineKind) => {
    switch (kind) {
      case 'home':
        return <Icon as={BsHouseDoor} />
      case 'local':
        return <Icon as={BsPeople} />
      case 'public':
        return <Icon as={BsGlobe2} />
      case 'favourites':
        return <Icon as={BsStar} />
      case 'list':
        return <Icon as={BsListUl} />
      case 'bookmarks':
        return <Icon as={BsBookmark} />
    }
  }

  const closeOptionPopover = () => triggerRef?.current.close()

  const updateStatus = (status: Entity.Status) => {
    const renew = statuses.map(s => {
      if (s.id === status.id) {
        return status
      } else if (s.reblog && s.reblog.id === status.id) {
        return Object.assign({}, s, { reblog: status })
      } else if (status.reblog && s.id === status.reblog.id) {
        return status.reblog
      } else if (status.reblog && s.reblog && s.reblog.id === status.reblog.id) {
        return Object.assign({}, s, { reblog: status.reblog })
      } else {
        return s
      }
    })
    setStatuses(renew)
  }

  const loadMore = useCallback(async () => {
    console.debug('appending')
    let maxId = null
    switch (props.timeline.kind) {
      case 'favourites':
      case 'bookmarks':
        if (!nextMaxId) {
          return
        }
        maxId = nextMaxId
        break
      default:
        maxId = statuses[statuses.length - 1].id
        break
    }

    const append = await loadTimeline(props.timeline, client, maxId)
    setStatuses(last => [...last, ...append])
  }, [client, statuses, setStatuses, nextMaxId])

  const prependUnreads = useCallback(() => {
    console.debug('prepending')
    const unreads = unreadStatuses.slice().reverse().slice(0, TIMELINE_STATUSES_COUNT).reverse()
    const remains = unreadStatuses.slice(0, -1 * TIMELINE_STATUSES_COUNT)
    setUnreadStatuses(() => remains)
    setFirstItemIndex(() => firstItemIndex - unreads.length)
    setStatuses(() => [...unreads, ...statuses])
    return false
  }, [firstItemIndex, statuses, setStatuses, unreadStatuses])

  return (
    <div style={{ width: '340px', minWidth: '340px', margin: '0 4px' }}>
      <Container style={{ height: 'calc(100% - 8px)', overflowY: 'scroll' }}>
        <Header style={{ backgroundColor: 'var(--rs-gray-800)' }}>
          <FlexboxGrid align="middle" justify="space-between">
            <FlexboxGrid.Item colspan={18}>
              <FlexboxGrid align="middle">
                {/** icon **/}
                <FlexboxGrid.Item
                  colspan={4}
                  style={{ lineHeight: '48px', fontSize: '18px', paddingRight: '8px', paddingLeft: '8px', paddingBottom: '6px' }}
                >
                  {timelineIcon(props.timeline.kind)}
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
                  title={props.server.domain}
                >
                  {props.timeline.name}
                  <span style={{ fontSize: '14px', color: 'var(--rs-text-secondary)' }}>@{props.server.domain}</span>
                </FlexboxGrid.Item>
              </FlexboxGrid>
            </FlexboxGrid.Item>
            <FlexboxGrid.Item colspan={6}>
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
                  <Avatar circle src={FailoverImg(account ? account.avatar : null)} size="xs" />
                </FlexboxGrid.Item>
              </FlexboxGrid>
            </FlexboxGrid.Item>
          </FlexboxGrid>
        </Header>

        {loading ? (
          <Loader style={{ margin: '10em auto' }} />
        ) : (
          <Content style={{ height: 'calc(100% - 54px)' }}>
            <List
              style={{
                width: '340px',
                height: '100%'
              }}
            >
              <Virtuoso
                style={{ height: '100%' }}
                data={statuses}
                scrollerRef={ref => {
                  scrollerRef.current = ref as HTMLElement
                }}
                firstItemIndex={firstItemIndex}
                atTopStateChange={prependUnreads}
                endReached={loadMore}
                overscan={TIMELINE_STATUSES_COUNT}
                itemContent={(_, status) => (
                  <List.Item key={status.id} style={{ paddingTop: '2px', paddingBottom: '2px', backgroundColor: 'var(--rs-gray-800)' }}>
                    <Status
                      status={status}
                      client={client}
                      server={props.server}
                      updateStatus={updateStatus}
                      openMedia={props.openMedia}
                      setReplyOpened={opened => (replyOpened.current = opened)}
                      setStatusDetail={props.setStatusDetail}
                      setAccountDetail={props.setAccountDetail}
                    />
                  </List.Item>
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

const prependStatus = (statuses: Array<Entity.Status>, status: Entity.Status): Array<Entity.Status> => {
  if (statuses.find(s => s.id === status.id && s.uri === status.uri)) {
    return statuses
  }
  return [status].concat(statuses)
}

const appendStatus = (statuses: Array<Entity.Status>, status: Entity.Status): Array<Entity.Status> => {
  if (statuses.find(s => s.id === status.id && s.uri === status.uri)) {
    return statuses
  }
  return [status].concat(statuses).slice(0, TIMELINE_STATUSES_COUNT)
}

const deleteStatus = (statuses: Array<Entity.Status>, deleted_id: string): Array<Entity.Status> => {
  return statuses.filter(status => {
    if (status.reblog !== null && status.reblog.id === deleted_id) {
      return false
    } else {
      return status.id !== deleted_id
    }
  })
}

export default Timeline
