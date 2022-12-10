import { Icon } from '@rsuite/icons'
import { invoke } from '@tauri-apps/api/tauri'
import generator, { Entity, MegalodonInterface } from 'megalodon'
import { useEffect, useRef, useState, forwardRef, useCallback } from 'react'
import { Avatar, Container, Content, FlexboxGrid, Header, List, Whisper, Popover, Button, Loader, Message, useToaster } from 'rsuite'
import { BsHouseDoor, BsPeople, BsGlobe2, BsSliders, BsX, BsChevronLeft, BsChevronRight, BsStar, BsListUl } from 'react-icons/bs'
import { listen } from '@tauri-apps/api/event'
import { Virtuoso } from 'react-virtuoso'
import parse from 'parse-link-header'

import { Account } from 'src/entities/account'
import { Server } from 'src/entities/server'
import { Timeline } from 'src/entities/timeline'
import Status from './status/Status'
import FailoverImg from 'src/utils/failoverImg'
import { ReceiveHomeStatusPayload, ReceiveTimelineStatusPayload } from 'src/payload'
import { TIMELINE_STATUSES_COUNT, TIMELINE_MAX_STATUSES } from 'src/defaults'

type Props = {
  timeline: Timeline
  server: Server
  openMedia: (media: Entity.Attachment) => void
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
      } catch {
        toast.push(alert('error', `Failed to load ${props.timeline.timeline} timeline`), { placement: 'topStart' })
      } finally {
        setLoading(false)
      }
    }
    f()

    if (props.timeline.timeline === 'home') {
      listen<ReceiveHomeStatusPayload>('receive-home-status', ev => {
        if (ev.payload.server_id !== props.server.id) {
          return
        }

        if (scrollerRef.current && scrollerRef.current.scrollTop > 10) {
          setUnreadStatuses(last => {
            if (last.find(s => s.id === ev.payload.status.id && s.uri === ev.payload.status.uri)) {
              return last
            }
            return [ev.payload.status].concat(last)
          })
          return
        }

        setStatuses(last => {
          if (last.find(s => s.id === ev.payload.status.id && s.uri === ev.payload.status.uri)) {
            return last
          }
          return [ev.payload.status].concat(last).slice(0, TIMELINE_STATUSES_COUNT)
        })
      })
    } else {
      listen<ReceiveTimelineStatusPayload>('receive-timeline-status', ev => {
        if (ev.payload.timeline_id !== props.timeline.id) {
          return
        }

        if (scrollerRef.current && scrollerRef.current.scrollTop > 10) {
          setUnreadStatuses(last => {
            if (last.find(s => s.id === ev.payload.status.id && s.uri === ev.payload.status.uri)) {
              return last
            }
            return [ev.payload.status].concat(last)
          })
          return
        }

        setStatuses(last => {
          if (last.find(s => s.id === ev.payload.status.id && s.uri === ev.payload.status.uri)) {
            return last
          }
          return [ev.payload.status].concat(last).slice(0, TIMELINE_STATUSES_COUNT)
        })
      })
    }
  }, [])

  const loadTimeline = async (tl: Timeline, client: MegalodonInterface, maxId?: string): Promise<Array<Entity.Status>> => {
    let options = { limit: TIMELINE_STATUSES_COUNT }
    if (maxId) {
      options = Object.assign({}, options, { max_id: maxId })
    }
    switch (tl.timeline) {
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
      case 'favourite': {
        const res = await client.getFavourites(options)
        const link = parse(res.headers.link)
        if (link !== null) {
          setNextMaxId(link.next.max_id)
        }
        return res.data
      }
      default:
        if (tl.list_id) {
          const res = await client.getListTimeline(tl.list_id, options)
          return res.data
        }
        return []
    }
  }

  const timelineIcon = (name: string) => {
    switch (name) {
      case 'home':
        return <Icon as={BsHouseDoor} />
      case 'local':
        return <Icon as={BsPeople} />
      case 'public':
        return <Icon as={BsGlobe2} />
      case 'favourite':
        return <Icon as={BsStar} />
      default:
        return <Icon as={BsListUl} />
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
    let maxId = nextMaxId
    if (!maxId) {
      maxId = statuses[statuses.length - 1].id
    }
    const append = await loadTimeline(props.timeline, client, maxId)
    setStatuses(last => [...last, ...append])
  }, [client, statuses, setStatuses, nextMaxId])

  const prependUnreads = useCallback(() => {
    console.debug('prepending')
    const unreads = unreadStatuses.slice().reverse().slice(0, TIMELINE_STATUSES_COUNT)
    const remains = unreadStatuses.slice(0, -1 * TIMELINE_STATUSES_COUNT)
    setUnreadStatuses(() => remains)
    setFirstItemIndex(() => firstItemIndex - unreads.length)
    setStatuses(() => [...unreads, ...statuses])
    return false
  }, [firstItemIndex, statuses, setStatuses, unreadStatuses])

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
                  {timelineIcon(props.timeline.timeline)}
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
          <Loader style={{ margin: '10rem auto' }} />
        ) : (
          <Content style={{ height: 'calc(100% - 54px)' }}>
            <List
              hover
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
                  <div key={status.id}>
                    <Status status={status} client={client} server={props.server} updateStatus={updateStatus} openMedia={props.openMedia} />
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
  <Message showIcon type={type} duration={5000}>
    {message}
  </Message>
)

export default Timeline
