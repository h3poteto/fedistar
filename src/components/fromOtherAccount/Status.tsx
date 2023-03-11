import { Entity, MegalodonInterface } from 'megalodon'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Loader, Modal, Placeholder } from 'rsuite'
import { Server } from 'src/entities/server'

type Props = {
  target: Entity.Status
  server: Server
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
        const res = await props.client.search(props.target.url, 'statuses')
        setStatuses(res.data.statuses)
      } catch (err) {
        console.error(err)
      } finally {
        setSearching(false)
      }
    }
    f()
  }, [props.client, props.target])

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
            statuses.map((status, index) => <div key={index}>{status.id}</div>)
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
