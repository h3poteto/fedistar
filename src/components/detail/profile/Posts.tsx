import { Entity, MegalodonInterface } from 'megalodon'
import { useEffect, useImperativeHandle, useState } from 'react'
import { List, Loader } from 'rsuite'
import Status from 'src/components/timelines/status/Status'
import { TIMELINE_STATUSES_COUNT } from 'src/defaults'
import { Account } from 'src/entities/account'
import { Server } from 'src/entities/server'

export type FuncProps = {
  loadMore: () => Promise<void>
}

type ArgProps = {
  client: MegalodonInterface
  user: Entity.Account
  server: Server
  account: Account
}

const Posts: React.ForwardRefRenderFunction<FuncProps, ArgProps> = (props, ref) => {
  const { client, user } = props
  const [statuses, setStatuses] = useState<Array<Entity.Status>>([])
  const [loading, setLoading] = useState<boolean>(false)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)

  useEffect(() => {
    const f = async () => {
      setLoading(true)
      try {
        const res = await client.getAccountStatuses(user.id, { limit: TIMELINE_STATUSES_COUNT })
        setStatuses(res.data)
      } finally {
        setLoading(false)
      }
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

  return (
    <div style={{ width: '100%' }}>
      {loading ? (
        <div style={{ textAlign: 'center' }}>
          <Loader style={{ margin: '5em auto' }} />
        </div>
      ) : (
        <List>
          {statuses.map(status => (
            <List.Item key={status.id} style={{ paddingTop: '2px', paddingBottom: '2px', backgroundColor: 'var(rs-gray-800)' }}>
              <Status
                status={status}
                client={client}
                server={props.server}
                account={props.account}
                updateStatus={() => {}}
                openMedia={() => {}}
                setReplyOpened={() => {}}
                setAccountDetail={() => {}}
              />
            </List.Item>
          ))}
        </List>
      )}
    </div>
  )
}

export default Posts
