import { Entity, MegalodonInterface } from 'megalodon'
import { useRouter } from 'next/router'
import { useEffect, useImperativeHandle, useState } from 'react'
import { List, Loader } from 'rsuite'
import Status from 'src/components/timelines/status/Status'
import { TIMELINE_STATUSES_COUNT } from 'src/defaults'
import { Account } from 'src/entities/account'
import { Behavior } from 'src/entities/behavior'
import { CustomEmojiCategory } from 'src/entities/emoji'
import { Server } from 'src/entities/server'
import { mapCustomEmojiCategory } from 'src/utils/emojiData'

export type FuncProps = {
  loadMore: () => Promise<void>
}

type ArgProps = {
  client: MegalodonInterface
  user: Entity.Account
  server: Server
  account: Account | null
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
  openReport: (status: Entity.Status, client: MegalodonInterface, server: Server) => void
  openFromOtherAccount: (status: Entity.Status) => void
  setStatusDetail: (statusId: string, serverId: number, accountId?: number) => void
  locale: string
  behavior: Behavior
}

const Posts: React.ForwardRefRenderFunction<FuncProps, ArgProps> = (props, ref) => {
  const { client, user } = props
  const [pinned, setPinned] = useState<Array<Entity.Status>>([])
  const [statuses, setStatuses] = useState<Array<Entity.Status>>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const [customEmojis, setCustomEmojis] = useState<Array<CustomEmojiCategory>>([])

  const router = useRouter()

  useEffect(() => {
    const f = async () => {
      setLoading(true)
      try {
        const pin = await client.getAccountStatuses(user.id, { limit: TIMELINE_STATUSES_COUNT, pinned: true })
        setPinned(pin.data)
        const res = await client.getAccountStatuses(user.id, { limit: TIMELINE_STATUSES_COUNT })
        setStatuses(res.data)
      } finally {
        setLoading(false)
      }
      const emojis = await client.getInstanceCustomEmojis()
      setCustomEmojis(mapCustomEmojiCategory(props.server.domain, emojis.data))
    }
    f()
  }, [user, client])

  useImperativeHandle(ref, () => ({
    async loadMore() {
      console.debug('appending')
      if (loadingMore || statuses.length <= 0) return
      try {
        setLoadingMore(true)
        const maxId = statuses[statuses.length - 1].id
        const res = await client.getAccountStatuses(user.id, { max_id: maxId, limit: TIMELINE_STATUSES_COUNT })
        setStatuses(last => [...last, ...res.data])
      } finally {
        setLoadingMore(false)
      }
    }
  }))

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
    <div style={{ width: '100%' }}>
      {loading ? (
        <div style={{ textAlign: 'center' }}>
          <Loader style={{ margin: '5em auto' }} />
        </div>
      ) : (
        <List>
          {pinned.map(status => (
            <List.Item key={status.id} style={{ paddingTop: '2px', paddingBottom: '2px', backgroundColor: 'var(rs-bg-card)' }}>
              <Status
                status={status}
                client={client}
                server={props.server}
                account={props.account}
                columnWidth="sm"
                pinned={true}
                updateStatus={updateStatus}
                openMedia={props.openMedia}
                setStatusDetail={props.setStatusDetail}
                setAccountDetail={setAccountDetail}
                setTagDetail={setTagDetail}
                openReport={props.openReport}
                openFromOtherAccount={props.openFromOtherAccount}
                customEmojis={customEmojis}
                locale={props.locale}
                behavior={props.behavior}
              />
            </List.Item>
          ))}
          {statuses.map(status => (
            <List.Item key={status.id} style={{ paddingTop: '2px', paddingBottom: '2px', backgroundColor: 'var(rs-bg-card)' }}>
              <Status
                status={status}
                client={client}
                server={props.server}
                account={props.account}
                columnWidth="sm"
                updateStatus={updateStatus}
                openMedia={props.openMedia}
                setStatusDetail={props.setStatusDetail}
                setAccountDetail={setAccountDetail}
                setTagDetail={setTagDetail}
                openReport={props.openReport}
                openFromOtherAccount={props.openFromOtherAccount}
                customEmojis={customEmojis}
                locale={props.locale}
                behavior={props.behavior}
              />
            </List.Item>
          ))}
        </List>
      )}
    </div>
  )
}

export default Posts
