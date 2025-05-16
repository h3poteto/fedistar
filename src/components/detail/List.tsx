import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/core'
import generator, { Entity, MegalodonInterface } from 'megalodon'
import { useRouter } from 'next/router'
import { Content, List, Header, FlexboxGrid, Button, Loader } from 'rsuite'
import { BsX, BsChevronLeft, BsPin } from 'react-icons/bs'
import { Icon } from '@rsuite/icons'
import { Virtuoso } from 'react-virtuoso'

import { Server } from 'src/entities/server'
import { Account } from 'src/entities/account'
import Status from '../timelines/status/Status'
import { FormattedMessage, useIntl } from 'react-intl'
import { CustomEmojiCategory } from 'src/entities/emoji'
import { mapCustomEmojiCategory } from 'src/utils/emojiData'
import { Behavior } from 'src/entities/behavior'

type Props = {
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
  openReport: (status: Entity.Status, client: MegalodonInterface) => void
  openFromOtherAccount: (status: Entity.Status) => void
  setStatusDetail: (statusId: string, serverId: number, accountId?: number) => void
  locale: string
  behavior: Behavior
}

export default function ListDetail(props: Props) {
  const router = useRouter()
  const { formatMessage } = useIntl()

  const [client, setClient] = useState<MegalodonInterface | null>(null)
  const [server, setServer] = useState<Server | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [statuses, setStatuses] = useState<Array<Entity.Status>>([])
  const [list, setList] = useState<Entity.List | null>(null)
  const [customEmojis, setCustomEmojis] = useState<Array<CustomEmojiCategory>>([])
  const [filters, setFilters] = useState<Array<Entity.Filter>>([])

  useEffect(() => {
    const f = async () => {
      if (router.query.account_id && router.query.list_id) {
        const [account, server] = await invoke<[Account, Server]>('get_account', {
          id: parseInt(router.query.account_id.toLocaleString())
        })
        setServer(server)
        setAccount(account)
        const cli = generator(server.sns, server.base_url, account.access_token, 'Fedistar')
        setClient(cli)

        const f = await loadFilter(cli)
        setFilters(f)
        const listID = router.query.list_id.toString()
        const res = await cli.getList(listID)
        setList(res.data)

        const emojis = await cli.getInstanceCustomEmojis()
        setCustomEmojis(mapCustomEmojiCategory(server.domain, emojis.data))
      }
    }

    f()
  }, [router.query.list_id, router.query.server_id, router.query.account_id])

  useEffect(() => {
    if (list && client) {
      const f = async () => {
        const res = await client.getListTimeline(router.query.list_id.toString())
        setStatuses(res.data)
      }
      f()
    }
  }, [list, client])

  const loadFilter = async (client: MegalodonInterface): Promise<Array<Entity.Filter>> => {
    try {
      const res = await client.getFilters()
      return res.data.filter(f => f.context.includes('home'))
    } catch (err) {
      console.warn(err)
    }
  }

  const back = () => {
    router.back()
  }

  const close = () => {
    router.push({ query: {} })
  }

  const addTimeline = async () => {
    if (list) {
      await invoke('add_timeline', { server: server, kind: 'list', name: list.title, list_id: list.id, columnWidth: 'sm' })
    }
  }

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

  return (
    <>
      <Header style={{ backgroundColor: 'var(--rs-border-secondary)' }}>
        <FlexboxGrid justify="space-between">
          <FlexboxGrid.Item>
            <Button appearance="link" onClick={back}>
              <Icon as={BsChevronLeft} style={{ fontSize: '1.4em' }} />
              <FormattedMessage id="detail.back" />
            </Button>
          </FlexboxGrid.Item>
          <FlexboxGrid.Item>
            <Button appearance="link" onClick={addTimeline} title={formatMessage({ id: 'detail.pin' })}>
              <Icon as={BsPin} style={{ fontSize: '1.2em' }} />
            </Button>
            <Button appearance="link" onClick={close} title={formatMessage({ id: 'detail.close' })}>
              <Icon as={BsX} style={{ fontSize: '1.4em' }} />
            </Button>
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </Header>
      {statuses.length === 0 ? (
        <Loader style={{ margin: '10em auto' }} />
      ) : (
        <Content style={{ height: '100%', backgroundColor: 'var(--rs-bg-card)' }}>
          <List style={{ height: '100%' }}>
            <Virtuoso
              style={{ height: '100%' }}
              data={statuses}
              className="timeline-scrollable"
              itemContent={(_, status) => (
                <List.Item key={status.id} style={{ paddingTop: '2px', paddingBottom: '2px', backgroundColor: 'var(--rs-bg-card)' }}>
                  <Status
                    status={status}
                    client={client}
                    server={server}
                    account={account}
                    columnWidth="sm"
                    updateStatus={updateStatus}
                    openMedia={props.openMedia}
                    setReplyOpened={() => null}
                    setStatusDetail={props.setStatusDetail}
                    setAccountDetail={setAccountDetail}
                    setTagDetail={setTagDetail}
                    openReport={props.openReport}
                    openFromOtherAccount={props.openFromOtherAccount}
                    customEmojis={customEmojis}
                    filters={filters}
                    locale={props.locale}
                    behavior={props.behavior}
                  />
                </List.Item>
              )}
            />
          </List>
        </Content>
      )}
    </>
  )
}
