import { Icon } from '@rsuite/icons'
import { invoke } from '@tauri-apps/api/tauri'
import { useRef, forwardRef, useState, useEffect, useCallback } from 'react'
import { BsEnvelope, BsSliders, BsX, BsChevronLeft, BsChevronRight } from 'react-icons/bs'
import { Avatar, Container, Content, FlexboxGrid, Header, List, Whisper, Popover, Button, Loader, useToaster } from 'rsuite'
import generator, { MegalodonInterface } from 'megalodon'
import parse from 'parse-link-header'

import FailoverImg from 'src/utils/failoverImg'
import { Server } from 'src/entities/server'
import { Account } from 'src/entities/account'
import { Timeline } from 'src/entities/timeline'
import { TIMELINE_STATUSES_COUNT, TIMELINE_MAX_STATUSES } from 'src/defaults'
import alert from '../utils/alert'
import { Virtuoso } from 'react-virtuoso'
import Conversation from './conversation/Conversation'
import { listen } from '@tauri-apps/api/event'
import { ReceiveTimelineConversationPayload } from 'src/payload'
import { useRouter } from 'next/router'
import { useTranslation } from 'react-i18next'
import timelineName from 'src/utils/timelineName'

type Props = {
  server: Server
  timeline: Timeline
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
}

const Conversations: React.FC<Props> = props => {
  const { t } = useTranslation()

  const [account, setAccount] = useState<Account | null>(null)
  const [client, setClient] = useState<MegalodonInterface>()
  const [conversations, setConversations] = useState<Array<Entity.Conversation>>([])
  const [unreadConversations, setUnreadConversations] = useState<Array<Entity.Conversation>>([])
  const [firstItemIndex, setFirstItemIndex] = useState(TIMELINE_MAX_STATUSES)
  const [loading, setLoading] = useState(false)
  const [nextMaxId, setNextMaxId] = useState<string | null>(null)

  const scrollerRef = useRef<HTMLElement | null>(null)
  const triggerRef = useRef(null)
  const toast = useToaster()
  const router = useRouter()

  useEffect(() => {
    const f = async () => {
      if (props.server.account_id) {
        setLoading(true)
        try {
          const [account, _] = await invoke<[Account, Server]>('get_account', { id: props.server.account_id })
          setAccount(account)
          const client = generator(props.server.sns, props.server.base_url, account.access_token, 'Fedistar')
          setClient(client)

          const res = await loadConversations(client)
          setConversations(res)
        } catch (err) {
          console.error(err)
          toast.push(alert('error', t('alert.failed_load', { timeline: 'conversations' })), { placement: 'topStart' })
        } finally {
          setLoading(false)
        }
      }
    }
    f()

    listen<ReceiveTimelineConversationPayload>('receive-timeline-conversation', ev => {
      if (ev.payload.timeline_id !== props.timeline.id) {
        return
      }

      if (scrollerRef.current && scrollerRef.current.scrollTop > 10) {
        // When scrolling, prepend and update unreads, and update conversations
        setUnreadConversations(current => prependConversation(current, ev.payload.conversation))
        setConversations(current => updateConversation(current, ev.payload.conversation))
      } else {
        // When top, prepend and update conversations
        setConversations(current => prependConversation(current, ev.payload.conversation))
      }
    })
  }, [])

  const loadConversations = async (client: MegalodonInterface, maxId?: string): Promise<Array<Entity.Conversation>> => {
    let options = { limit: TIMELINE_STATUSES_COUNT }
    if (maxId) {
      options = Object.assign({}, options, { max_id: maxId })
    }
    const res = await client.getConversationTimeline(options)
    const link = parse(res.headers.link)
    if (link !== null && link.next) {
      setNextMaxId(link.next.max_id)
    }
    return res.data
  }

  const selectStatus = (conversationId: string, status: Entity.Status | null) => {
    if (status) {
      if (account) {
        router.push({ query: { status_id: status.id, server_id: props.server.id, account_id: account.id } })
      } else {
        router.push({ query: { status_id: status.id, server_id: props.server.id } })
      }
      client.readConversation(conversationId)
    }
  }

  const closeOptionPopover = () => triggerRef?.current.close()

  const loadMore = useCallback(async () => {
    console.debug('appending')
    if (nextMaxId) {
      const append = await loadConversations(client, nextMaxId)
      setConversations(last => [...last, ...append])
    }
  }, [client, conversations, setConversations, nextMaxId])

  const prependUnreads = useCallback(() => {
    console.debug('prepending')
    const unreads = unreadConversations.slice().reverse().slice(0, TIMELINE_STATUSES_COUNT).reverse()
    const remains = unreadConversations.slice(0, -1 * TIMELINE_STATUSES_COUNT)
    setUnreadConversations(() => remains)
    setFirstItemIndex(() => firstItemIndex - unreads.length)
    setConversations(() => [...unreads, ...conversations])
    return false
  }, [firstItemIndex, conversations, setConversations, unreadConversations])

  return (
    <div style={{ width: '340px', minWidth: '340px', margin: '0 4px' }}>
      <Container style={{ height: 'calc(100% - 8px)' }}>
        <Header style={{ backgroundColor: 'var(--rs-gray-800)' }}>
          <FlexboxGrid align="middle" justify="space-between">
            <FlexboxGrid.Item colspan={18}>
              <FlexboxGrid align="middle">
                {/** icon **/}
                <FlexboxGrid.Item
                  colspan={4}
                  style={{ lineHeight: '48px', fontSize: '18px', paddingRight: '8px', paddingLeft: '8px', paddingBottom: '6px' }}
                >
                  <Icon as={BsEnvelope} />
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
            <FlexboxGrid.Item colspan={6}>
              <FlexboxGrid align="middle" justify="end">
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
          <Loader style={{ margin: '10em auto ' }} />
        ) : (
          <Content style={{ height: 'calc(100% - 54px)' }}>
            <List hover style={{ width: '340px', height: '100%' }}>
              <Virtuoso
                style={{ height: '100%' }}
                data={conversations}
                scrollerRef={ref => {
                  scrollerRef.current = ref as HTMLElement
                }}
                firstItemIndex={firstItemIndex}
                atTopStateChange={prependUnreads}
                endReached={loadMore}
                overscan={TIMELINE_STATUSES_COUNT}
                itemContent={(_, conversation) => (
                  <List.Item
                    key={conversation.id}
                    style={{ paddingTop: '2px', paddingBottom: '2px', backgroundColor: 'var(--rs-gray-800)' }}
                  >
                    <Conversation conversation={conversation} openMedia={props.openMedia} selectStatus={selectStatus} />
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

const prependConversation = (conversations: Array<Entity.Conversation>, conversation: Entity.Conversation): Array<Entity.Conversation> => {
  if (conversations.find(c => c.id === conversation.id)) {
    return updateConversation(conversations, conversation)
  }
  return [conversation, ...conversations]
}

const updateConversation = (conversations: Array<Entity.Conversation>, conversation: Entity.Conversation): Array<Entity.Conversation> => {
  return conversations.map(c => {
    if (c.id === conversation.id) {
      return conversation
    }
    return c
  })
}

export default Conversations
