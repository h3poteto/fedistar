import { Entity, MegalodonInterface } from 'megalodon'
import { useEffect, useImperativeHandle, useState } from 'react'
import { List, Loader } from 'rsuite'
import parse from 'parse-link-header'
import { TIMELINE_STATUSES_COUNT } from 'src/defaults'
import User from './User'

export type FuncProps = {
  loadMore: () => Promise<void>
}

type ArgProps = {
  client: MegalodonInterface
  user: Entity.Account
}

const Following: React.ForwardRefRenderFunction<FuncProps, ArgProps> = (props, ref) => {
  const { client, user } = props
  const [following, setFollowing] = useState<Array<Entity.Account>>([])
  const [relationships, setRelationships] = useState<Array<Entity.Relationship>>([])
  const [loading, setLoading] = useState(false)
  const [loadingMore, setLoadingMore] = useState<boolean>(false)
  const [nextMaxId, setNextMaxId] = useState<string | null>(null)

  useEffect(() => {
    const f = async () => {
      setLoading(true)
      try {
        const f = await loadFollowing(user, client)
        setFollowing(f)
        const r = await loadRelationship(f, client)
        setRelationships(r)
      } finally {
        setLoading(false)
      }
    }
    f()
  }, [client, user])

  useImperativeHandle(ref, () => ({
    async loadMore() {
      console.debug('appending')
      if (loadingMore || following.length <= 0) return
      try {
        setLoadingMore(true)
        if (nextMaxId) {
          const f = await loadFollowing(user, client, nextMaxId)
          setFollowing(current => [...current, ...f])
          const r = await loadRelationship(f, client)
          setRelationships(current => [...current, ...r])
        }
      } finally {
        setLoadingMore(false)
      }
    }
  }))

  const loadFollowing = async (user: Entity.Account, client: MegalodonInterface, maxId?: string): Promise<Array<Entity.Account>> => {
    let options = { limit: TIMELINE_STATUSES_COUNT }
    if (maxId) {
      options = Object.assign({}, options, { max_id: maxId })
    }
    const res = await client.getAccountFollowing(user.id, options)
    const link = parse(res.headers.link)
    if (link !== null && link.next) {
      setNextMaxId(link.next.max_id)
    } else {
      setNextMaxId(null)
    }
    return res.data
  }

  const loadRelationship = async (users: Array<Entity.Account>, client: MegalodonInterface): Promise<Array<Entity.Relationship>> => {
    const ids = users.map(a => a.id)
    const rel = await client.getRelationships(ids)
    return rel.data
  }

  const follow = async (user: Entity.Account) => {
    const res = await client.followAccount(user.id)
    setRelationships(current =>
      current.map(r => {
        if (r.id === res.data.id) {
          return res.data
        }
        return r
      })
    )
  }

  const unfollow = async (user: Entity.Account) => {
    const res = await client.unfollowAccount(user.id)
    setRelationships(current =>
      current.map(r => {
        if (r.id === res.data.id) {
          return res.data
        }
        return r
      })
    )
  }

  return (
    <div style={{ width: '100%' }}>
      {loading ? (
        <div style={{ textAlign: 'center' }}>
          <Loader style={{ margin: '5em auto' }} />
        </div>
      ) : (
        <List>
          {following.map((account, index) => (
            <List.Item key={account.id} style={{ padding: '4px 0', backgroundColor: 'var(rs-gary-800)' }}>
              <User user={account} relationship={relationships[index]} follow={follow} unfollow={unfollow} />
            </List.Item>
          ))}
        </List>
      )}
    </div>
  )
}

export default Following
