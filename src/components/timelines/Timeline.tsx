import { Icon } from '@rsuite/icons'
import { invoke } from '@tauri-apps/api/tauri'
import generator, { Entity, detector, MegalodonInterface } from 'megalodon'
import { useEffect, useRef, useState, forwardRef } from 'react'
import { Avatar, Container, Content, FlexboxGrid, Header, List, Whisper, Popover, Button, Loader, Message, useToaster } from 'rsuite'
import { BsHouseDoor, BsPeople, BsQuestion, BsGlobe2, BsSliders, BsX, BsChevronLeft, BsChevronRight } from 'react-icons/bs'
import { useVirtualizer } from '@tanstack/react-virtual'
import { listen } from '@tauri-apps/api/event'

import { Account } from 'src/entities/account'
import { Server } from 'src/entities/server'
import { Timeline } from 'src/entities/timeline'
import Status from './status/Status'
import FailoverImg from 'src/components/utils/failoverImg'

type Props = {
  timeline: Timeline
  server: Server
}

type ReceiveHomeStatusPayload = {
  server_id: number
  status: Entity.Status
}

type ReceiveTimelineStatusPayload = {
  timeline_id: number
  status: Entity.Status
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

const alert = (type: string, message: string) => (
  <Message showIcon type={type} duration={5000}>
    {message}
  </Message>
)

const Timeline: React.FC<Props> = props => {
  const [statuses, setStatuses] = useState<Array<Entity.Status>>([])
  const [account, setAccount] = useState<Account | null>(null)
  const [client, setClient] = useState<MegalodonInterface>()
  const [loading, setLoading] = useState<boolean>(false)

  const parentRef = useRef<HTMLDivElement>(null)
  const triggerRef = useRef(null)
  const toast = useToaster()

  useEffect(() => {
    const f = async () => {
      setLoading(true)
      const sns = await detector(props.server.base_url)
      let client: MegalodonInterface
      if (props.server.account_id) {
        const account = await invoke<Account>('get_account', { id: props.server.account_id })
        setAccount(account)
        client = generator(sns, props.server.base_url, account.access_token, 'Fedistar')
        setClient(client)
      } else {
        client = generator(sns, props.server.base_url, undefined, 'Fedistar')
        setClient(client)
      }
      try {
        const res = await loadTimeline(props.timeline.timeline, client)
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

        setStatuses(last => {
          if (last.find(s => s.id === ev.payload.status.id && s.uri === ev.payload.status.uri)) {
            return last
          }
          return [ev.payload.status].concat(last)
        })
      })
    }
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
      case 'public': {
        const res = await client.getPublicTimeline({ limit: 40 })
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
      case 'public':
        return <Icon as={BsGlobe2} />
      default:
        return <Icon as={BsQuestion} />
    }
  }

  const closeOptionPopover = () => triggerRef?.current.close()

  const updateStatus = (status: Entity.Status) => {
    const renew = statuses.map(s => {
      if (s.id === status.id) {
        return status
      } else if (s.reblog && s.reblog.id === status.id) {
        return Object.assign({}, s, { reblog: status })
      } else {
        return s
      }
    })
    setStatuses(renew)
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
                    <Status status={statuses[virtualRow.index]} client={client} updateStatus={updateStatus} />
                  </div>
                ))}
              </div>
            </List>
          </Content>
        )}
      </Container>
    </div>
  )
}

export default Timeline
