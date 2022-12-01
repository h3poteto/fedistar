import Image from 'next/image'
import { Entity } from 'megalodon'
import { Tag } from 'rsuite'
import { Icon } from '@rsuite/icons'
import { BsCameraVideo, BsVolumeUp } from 'react-icons/bs'

type Props = {
  attachments: Array<Entity.Attachment>
  openMedia: (media: Entity.Attachment) => void
}

const Attachments: React.FC<Props> = props => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      {props.attachments.map((media, index) => (
        <div key={index} style={{ margin: '4px' }}>
          <Attachment media={media} openMedia={props.openMedia} />
        </div>
      ))}
    </div>
  )
}

type AttachmentProps = {
  media: Entity.Attachment
  openMedia: (media: Entity.Attachment) => void
}

const Attachment: React.FC<AttachmentProps> = props => {
  const { media } = props

  switch (media.type) {
    case 'gifv':
      return (
        <Tag>
          <Icon as={BsCameraVideo} style={{ fontSize: '1.2em', paddingRight: '4px' }} />
          GIF
        </Tag>
      )
    case 'video':
      return (
        <Tag>
          <Icon as={BsCameraVideo} style={{ fontSize: '1.2em', paddingRight: '4px' }} />
          VIDEO
        </Tag>
      )
    case 'audio':
      return (
        <Tag>
          <Icon as={BsVolumeUp} style={{ fontSize: '1.2em', paddingRight: '4px' }} />
          AUDIO
        </Tag>
      )
    default:
      return (
        <Image
          width={128}
          height={128}
          src={media.preview_url}
          alt={media.description ? media.description : media.id}
          onClick={() => props.openMedia(media)}
          style={{ objectFit: 'cover' }}
        />
      )
  }
}

export default Attachments
