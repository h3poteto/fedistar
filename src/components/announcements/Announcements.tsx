import generator, { Entity, MegalodonInterface } from 'megalodon'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Carousel, Modal } from 'rsuite'
import { Account } from 'src/entities/account'
import { Server } from 'src/entities/server'

type Props = {
  opened: boolean
  server: Server
  account: Account
  close: () => void
}

export default function Announcements(props: Props) {
  const { t } = useTranslation()
  const [announcements, setAnnouncements] = useState<Array<Entity.Announcement>>([])
  const [client, setClient] = useState<MegalodonInterface | null>(null)

  useEffect(() => {
    const client = generator(props.server.sns, props.server.base_url, props.account.access_token, 'Fedistar')
    setClient(client)
    const f = async () => {
      const a = await client.getInstanceAnnouncements()
      setAnnouncements(a.data)
    }
    f()
  }, [props.server, props.account])

  const onSelect = async (index: number) => {
    const target = announcements[index]
    if (target && client) {
      await client.dismissInstanceAnnouncement(target.id)
    }
  }

  return (
    <Modal size="sm" open={props.opened} onClose={props.close}>
      <Modal.Header>
        <Modal.Title>{t('announcements.title', { domain: props.server.domain })}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Carousel placement="bottom" shape="bar" onSelect={onSelect}>
          {announcements.map((announcement, index) => (
            <div key={index}>
              <div dangerouslySetInnerHTML={{ __html: announcement.content }} style={{ padding: '1em' }} />
            </div>
          ))}
        </Carousel>
      </Modal.Body>
      <Modal.Footer>
        <Button appearance="subtle" onClick={props.close}>
          {t('announcements.close')}
        </Button>
      </Modal.Footer>
    </Modal>
  )
}
