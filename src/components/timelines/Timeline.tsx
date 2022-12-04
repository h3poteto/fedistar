import { Icon } from '@rsuite/icons'
import { invoke } from '@tauri-apps/api/tauri'
import generator, { Entity, MegalodonInterface } from 'megalodon'
import { useEffect, useRef, useState, forwardRef, useLayoutEffect } from 'react'
import { Avatar, Container, Content, FlexboxGrid, Header, List, Whisper, Popover, Button, Loader, Message, useToaster } from 'rsuite'
import { BsHouseDoor, BsPeople, BsGlobe2, BsSliders, BsX, BsChevronLeft, BsChevronRight, BsStar, BsListUl } from 'react-icons/bs'
import { listen } from '@tauri-apps/api/event'

import { Account } from 'src/entities/account'
import { Server } from 'src/entities/server'
import { Timeline } from 'src/entities/timeline'
import Status from './status/Status'
import FailoverImg from 'src/utils/failoverImg'
import { ReceiveHomeStatusPayload, ReceiveTimelineStatusPayload } from 'src/payload'

type Props = {
  timeline: Timeline
  server: Server
  openMedia: (media: Entity.Attachment) => void
}

const Timeline: React.FC<Props> = props => {
  const [statuses, setStatuses] = useState<Array<Entity.Status>>([])
  const [account, setAccount] = useState<Account | null>(null)
  const [client, setClient] = useState<MegalodonInterface>()
  const [loading, setLoading] = useState<boolean>(false)
  const [offset, setOffset] = useState<number | null>(null)

  const scrollRef = useRef<HTMLDivElement>(null)
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

        if (scrollRef && scrollRef.current && scrollRef.current.scrollTop > 10) {
          setOffset(scrollRef.current.scrollHeight - scrollRef.current.scrollTop)
        } else {
          setOffset(null)
        }
        setStatuses(last => {
          if (last.find(s => s.id === ev.payload.status.id && s.uri === ev.payload.status.uri)) {
            return last
          }
          return [ev.payload.status].concat(last)
        })
      })
    } else {
      listen<ReceiveTimelineStatusPayload>('receive-timeline-status', ev => {
        if (ev.payload.timeline_id !== props.timeline.id) {
          return
        }

        if (scrollRef && scrollRef.current && scrollRef.current.scrollTop > 10) {
          setOffset(scrollRef.current.scrollHeight - scrollRef.current.scrollTop)
        } else {
          setOffset(null)
        }
        setStatuses(last => {
          if (last.find(s => s.id === ev.payload.status.id && s.uri === ev.payload.status.uri)) {
            return last
          }
          return [ev.payload.status].concat(last)
        })
      })
    }
  }, [])

  useLayoutEffect(() => {
    if (scrollRef && scrollRef.current && offset) {
      scrollRef.current.scroll({ top: scrollRef.current.scrollHeight - offset })
    }
  }, [statuses])

  const loadTimeline = async (tl: Timeline, client: MegalodonInterface): Promise<Array<Entity.Status>> => {
    switch (tl.timeline) {
      case 'home': {
        const res = await client.getHomeTimeline({ limit: 40 })
        return res.data
      }
      case 'local': {
        const res = await client.getLocalTimeline({ limit: 40 })
        return res.data
      }
      case 'public': {
        const res = await client.getPublicTimeline({ limit: 40 })
        return res.data
      }
      case 'favourite': {
        const res = await client.getFavourites({ limit: 40 })
        return res.data
      }
      default:
        if (tl.list_id) {
          const res = await client.getListTimeline(tl.list_id, { limit: 40 })
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
              ref={scrollRef}
              style={{
                width: '340px',
                height: '100%'
              }}
            >
              {statuses.map(status => (
                <div key={status.id}>
                  <Status status={status} client={client} updateStatus={updateStatus} openMedia={props.openMedia} />
                </div>
              ))}
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
