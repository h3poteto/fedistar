import { Button, FlexboxGrid, Modal } from 'rsuite'
import Image from 'next/image'
import { Entity } from 'megalodon'
import { ReactElement, useCallback, useEffect, useState } from 'react'
import { Icon } from '@rsuite/icons'
import { BsChevronRight, BsChevronLeft } from 'react-icons/bs'

type Props = {
  index: number
  media: Array<Entity.Attachment>
  opened: boolean
  close: () => void
}

const Media: React.FC<Props> = props => {
  const [index, setIndex] = useState<number>(0)

  useEffect(() => {
    setIndex(props.index)
  }, [props.index])

  const next = useCallback(() => {
    if (index >= props.media.length - 1) {
      return
    }
    setIndex(current => current + 1)
  }, [props.media, index, setIndex])

  const previous = useCallback(() => {
    if (index <= 0) {
      return
    }
    setIndex(current => current - 1)
  }, [props.media, index, setIndex])

  return (
    <Modal open={props.opened} size="lg" onClose={props.close} style={{ height: 'calc(100% - 30px)' }} dialogClassName="media-dialog">
      <Modal.Header></Modal.Header>
      <Modal.Body style={{ height: '100%' }}>
        <FlexboxGrid style={{ height: '100%' }} align="middle">
          <FlexboxGrid.Item colspan={2}>
            <Button appearance="link" size="lg" disabled={index < 1} onClick={previous}>
              <Icon as={BsChevronLeft} style={{ fontSize: '1.5em' }} />
            </Button>
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={20} style={{ position: 'relative', height: '100%' }}>
            {props.media[index] && mediaComponent(props.media[index])}
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={2}>
            <Button appearance="link" size="lg" disabled={index >= props.media.length - 1} onClick={next}>
              <Icon as={BsChevronRight} style={{ fontSize: '1.5em' }} />
            </Button>
          </FlexboxGrid.Item>
        </FlexboxGrid>
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
      return <Image src={media.url} fill alt={media.description ? media.description : media.id} style={{ objectFit: 'contain' }} />
  }
}

export default Media
