import { Modal } from 'rsuite'
import Image from 'next/image'
import { Entity } from 'megalodon'
import { ReactElement } from 'react'

type Props = {
  media: Entity.Attachment | null
  opened: boolean
  close: () => void
}

const Media: React.FC<Props> = props => {
  return (
    <Modal open={props.opened} size="lg" onClose={props.close} style={{ height: 'calc(100% - 30px)' }} dialogClassName="media-dialog">
      <Modal.Header></Modal.Header>
      <Modal.Body style={{ height: '100%', textAlign: 'center', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
        {props.media && mediaComponent(props.media)}
      </Modal.Body>
    </Modal>
  )
}

const mediaComponent = (media: Entity.Attachment): ReactElement => {
  switch (media.type) {
    case 'gifv':
      return <video src={media.url} autoPlay loop style={{ objectFit: 'contain' }} />
    case 'video':
    case 'audio':
      return <video src={media.url} autoPlay loop controls style={{ objectFit: 'contain' }} />
    default:
      return <Image fill src={media.url} alt={media.description ? media.description : media.id} style={{ objectFit: 'contain' }} />
  }
}

export default Media
