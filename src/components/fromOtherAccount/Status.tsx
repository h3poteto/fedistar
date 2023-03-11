import { Entity, MegalodonInterface } from 'megalodon'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Avatar, Button, FlexboxGrid, Loader, Modal, Placeholder } from 'rsuite'
import { Icon } from '@rsuite/icons'
import { BsPaperclip } from 'react-icons/bs'
import { Server } from 'src/entities/server'
import emojify from 'src/utils/emojify'
import Time from 'src/components/utils/Time'
import Body from '../timelines/status/Body'
import Actions from '../timelines/status/Actions'
import { Account } from 'src/entities/account'

type Props = {
  target: Entity.Status
  server: Server
  account: Account
  client: MegalodonInterface | null
  next: () => void
}
export default function Status(props: Props) {
  const { t } = useTranslation()

  const [statuses, setStatuses] = useState<Array<Entity.Status>>([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (props.client === null) {
      return
    }
    const f = async () => {
      setSearching(true)
      try {
        const res = await props.client.search(props.target.url, 'statuses', { resolve: true, limit: 1 })
        setStatuses(res.data.statuses)
      } catch (err) {
        console.error(err)
      } finally {
        setSearching(false)
      }
    }
    f()
  }, [props.client, props.target])

  const replaceStatus = (status: Entity.Status) => {
    setStatuses(current =>
      current.map(s => {
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
    )
  }

  return (
    <>
      <Modal.Body>
        <Modal.Title>{t('from_other_account.status.title')}</Modal.Title>
        <div style={{ paddingTop: '2em' }}>
          {searching ? (
            <>
              <Placeholder.Paragraph rows={3} />
              <Loader center content={t('from_other_account.status.searching')} />
            </>
          ) : statuses.length > 0 ? (
            statuses.map((status, index) => (
              <Post
                client={props.client}
                status={status}
                key={index}
                updateStatus={replaceStatus}
                server={props.server}
                account={props.account}
              />
            ))
          ) : (
            <p style={{ color: 'var(--rs-state-error)' }}>{t('from_other_account.status.not_found', { server: props.server.domain })}</p>
          )}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button appearance="primary" block onClick={() => props.next()}>
          {t('from_other_account.status.next')}
        </Button>
      </Modal.Footer>
    </>
  )
}

type PostProps = {
  server: Server
  account: Account
  status: Entity.Status
  client: MegalodonInterface
  updateStatus: (status: Entity.Status) => void
}

function Post(props: PostProps) {
  const { status, client } = props

  return (
    <FlexboxGrid>
      {/** icon **/}
      <FlexboxGrid.Item colspan={3}>
        <div style={{ margin: '6px' }}>
          <Avatar src={status.account.avatar} style={{ cursor: 'pointer' }} title={status.account.acct} alt={status.account.acct} />
        </div>
      </FlexboxGrid.Item>
      {/** status **/}
      <FlexboxGrid.Item colspan={21} style={{ paddingRight: '8px' }}>
        <div className="metadata">
          <FlexboxGrid>
            {/** account name **/}
            <FlexboxGrid.Item colspan={18} style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
              <span dangerouslySetInnerHTML={{ __html: emojify(status.account.display_name, status.account.emojis) }} />
              <span>@{status.account.acct}</span>
            </FlexboxGrid.Item>
            {/** timestamp **/}
            <FlexboxGrid.Item colspan={6} style={{ textAlign: 'right' }}>
              <Time time={status.created_at} />
            </FlexboxGrid.Item>
          </FlexboxGrid>
        </div>
        <Body status={status} />
        {status.media_attachments.map((media, index) => (
          <div key={index}>
            <Button appearance="subtle" size="sm">
              <Icon as={BsPaperclip} />
              {media.id}
            </Button>
          </div>
        ))}
        <div className="toolbox">
          <Actions
            disabled={{
              reply: true,
              reblog: false,
              favourite: false,
              bookmark: false,
              emoji: true,
              detail: true
            }}
            server={props.server}
            account={props.account}
            status={status}
            client={client}
            updateStatus={props.updateStatus}
          />
        </div>
      </FlexboxGrid.Item>
    </FlexboxGrid>
  )
}
