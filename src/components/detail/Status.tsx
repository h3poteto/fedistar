import { Icon } from '@rsuite/icons'
import { Entity, MegalodonInterface } from 'megalodon'
import { useCallback, useEffect, useState } from 'react'
import { BsX } from 'react-icons/bs'
import { Button, Container, Content, Header } from 'rsuite'
import { Server } from 'src/entities/server'
import Status from '../timelines/status/Status'

type Props = {
  client: MegalodonInterface
  status: Entity.Status
  server: Server
  onClose: () => void
  openMedia: (media: Entity.Attachment) => void
  setStatusDetail: (status: Entity.Status, server: Server, client: MegalodonInterface) => void
}

const StatusDetail: React.FC<Props> = props => {
  const [status, setStatus] = useState(props.status)

  useEffect(() => {
    setStatus(props.status)
    const f = async () => {
      const res = await props.client.getStatus(props.status.id)
      setStatus(res.data)
    }
    f()
  }, [props.status, props.client])

  const updateStatus = useCallback(
    (updated: Entity.Status) => {
      if (status.id === updated.id) {
        setStatus(updated)
      } else if (status.reblog && status.reblog.id === updated.id) {
        setStatus(Object.assign({}, status, { reblog: updated }))
      } else if (updated.reblog && updated.reblog && status.reblog.id === updated.reblog.id) {
        setStatus(Object.assign({}, status, { reblog: updated.reblog }))
      }
    },
    [status, setStatus]
  )

  return (
    <Container>
      <Header style={{ borderBottom: '1px solid var(--rs-divider-border)', backgroundColor: 'var(--rs-sidenav-default-bg)' }}>
        <Button appearance="link" onClick={props.onClose}>
          <Icon as={BsX} style={{ fontSize: '1.4em' }} />
        </Button>
      </Header>
      <Content style={{ height: '100%' }}>
        <Status
          status={status}
          client={props.client}
          server={props.server}
          updateStatus={updateStatus}
          openMedia={props.openMedia}
          setReplyOpened={() => null}
          setStatusDetail={props.setStatusDetail}
        />
      </Content>
    </Container>
  )
}

export default StatusDetail
