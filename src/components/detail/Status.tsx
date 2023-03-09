import { invoke } from '@tauri-apps/api/tauri'
import generator, { Entity, MegalodonInterface } from 'megalodon'
import { useRouter } from 'next/router'
import { useCallback, useEffect, useState } from 'react'
import { Content, List } from 'rsuite'
import { Server } from 'src/entities/server'
import { Account } from 'src/entities/account'
import Status from '../timelines/status/Status'

type Props = {
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
  openReport: (status: Entity.Status, client: MegalodonInterface) => void
}

const StatusDetail: React.FC<Props> = props => {
  const [client, setClient] = useState<MegalodonInterface | null>(null)
  const [server, setServer] = useState<Server | null>(null)
  const [account, setAccount] = useState<Account | null>(null)
  const [status, setStatus] = useState<Entity.Status | null>(null)
  const [ancestors, setAncestors] = useState<Array<Entity.Status>>([])
  const [descendants, setDescendants] = useState<Array<Entity.Status>>([])

  const router = useRouter()

  useEffect(() => {
    const f = async () => {
      let cli: MegalodonInterface
      if (router.query.account_id && router.query.server_id) {
        const [account, server] = await invoke<[Account, Server]>('get_account', {
          id: parseInt(router.query.account_id.toLocaleString())
        })
        setServer(server)
        setAccount(account)
        cli = generator(server.sns, server.base_url, account.access_token, 'Fedistar')
        setClient(cli)
      } else if (router.query.server_id) {
        const server = await invoke<Server>('get_server', { id: parseInt(router.query.server_id.toString()) })
        setServer(server)
        setAccount(null)
        cli = generator(server.sns, server.base_url, undefined, 'Fedistar')
        setClient(cli)
      }
      if (router.query.status_id) {
        const res = await cli.getStatus(router.query.status_id.toString())
        setStatus(res.data)
      } else {
        setStatus(null)
      }
    }
    f()
  }, [router.query.status_id, router.query.server_id, router.query.account_id])

  useEffect(() => {
    setAncestors([])
    setDescendants([])
    if (status) {
      const f = async () => {
        const c = await client.getStatusContext(status.id)
        setAncestors(c.data.ancestors)
        setDescendants(c.data.descendants)
      }
      f()
    }
  }, [status, client])

  const updateStatus = useCallback(
    (updated: Entity.Status) => {
      if (status.id === updated.id) {
        setStatus(updated)
      } else if (status.reblog && status.reblog.id === updated.id) {
        setStatus(Object.assign({}, status, { reblog: updated }))
      } else if (status.reblog && updated.reblog && status.reblog.id === updated.reblog.id) {
        setStatus(Object.assign({}, status, { reblog: updated.reblog }))
      }
      setAncestors(last =>
        last.map(status => {
          if (status.id === updated.id) {
            return updated
          } else if (status.reblog && status.reblog.id === updated.id) {
            return Object.assign({}, status, { reblog: updated })
          } else if (status.reblog && updated.reblog && status.reblog.id === updated.reblog.id) {
            return Object.assign({}, status, { reblog: updated.reblog })
          }
          return status
        })
      )

      setDescendants(last =>
        last.map(status => {
          if (status.id === updated.id) {
            return updated
          } else if (status.reblog && status.reblog.id === updated.id) {
            return Object.assign({}, status, { reblog: updated })
          } else if (status.reblog && updated.reblog && status.reblog.id === updated.reblog.id) {
            return Object.assign({}, status, { reblog: updated.reblog })
          }
          return status
        })
      )
    },
    [status, setStatus, ancestors, setAncestors, descendants, setDescendants]
  )

  const setAccountDetail = (userId: string, serverId: number, accountId?: number) => {
    if (accountId) {
      router.push({ query: { user_id: userId, server_id: serverId, account_id: accountId } })
    } else {
      router.push({ query: { user_id: userId, server_id: serverId } })
    }
  }

  return (
    <Content style={{ height: '100%', backgroundColor: 'var(--rs-gray-800)', overflowY: 'scroll' }}>
      <List hover style={{ width: '340px' }}>
        {[...ancestors, status, ...descendants]
          .filter(s => s !== null)
          .map(status => (
            <List.Item
              key={status.id}
              style={{
                paddingTop: '2px',
                paddingBottom: '2px',
                backgroundColor: 'var(--rs-gray-700)',
                boxShadow: '0 -1px 0 var(--rs-gray-900),0 1px 0 var(--rs-gray-900)'
              }}
            >
              <Status
                status={status}
                client={client}
                server={server}
                account={account}
                updateStatus={updateStatus}
                openMedia={props.openMedia}
                setReplyOpened={() => null}
                setAccountDetail={setAccountDetail}
                openReport={props.openReport}
              />
            </List.Item>
          ))}
      </List>
    </Content>
  )
}

export default StatusDetail
