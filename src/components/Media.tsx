import { Modal } from 'rsuite'
import Image from 'next/image'
import { Entity } from 'megalodon'

type Props = {
  media: Entity.Attachment | null
  opened: boolean
  close: () => void
}

const Media: React.FC<Props> = props => {
  return (
    <Modal open={props.opened} size="lg" onClose={props.close}>
      <Modal.Header></Modal.Header>
      <Modal.Body style={{ height: '600px' }}>
        {props.media && <Image layout="fill" objectFit="contain" src={props.media?.url} />}
      </Modal.Body>
    </Modal>
  )
}

export default Media
