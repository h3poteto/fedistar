import Image from 'next/image'
import { Entity } from 'megalodon'
import { Button, IconButton, Tag } from 'rsuite'
import { Icon } from '@rsuite/icons'
import { BsCameraVideo, BsVolumeUp, BsEyeSlash } from 'react-icons/bs'
import { useState } from 'react'
import { FormattedMessage } from 'react-intl'

type Props = {
  attachments: Array<Entity.Attachment>
  sensitive: boolean
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
}

const Attachments: React.FC<Props> = props => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      {props.attachments.map((media, index) => (
        <div key={index} style={{ margin: '4px' }}>
          <Attachment media={media} sensitive={props.sensitive} openMedia={() => props.openMedia(props.attachments, index)} />
        </div>
      ))}
    </div>
  )
}

type AttachmentProps = {
  media: Entity.Attachment
  sensitive: boolean
  openMedia: (media: Entity.Attachment) => void
}

const Attachment: React.FC<AttachmentProps> = props => {
  const { media } = props
  const [sensitive, setSensitive] = useState<boolean>(props.sensitive)

  const changeSensitive = () => {
    setSensitive(current => !current)
  }

  if (sensitive) {
    return (
      <Button appearance="default" block onClick={changeSensitive}>
        <FormattedMessage id="timeline.status.media_hidden" />
      </Button>
    )
  }

  switch (media.type) {
    case 'gifv':
      return (
        <Tag className="attachment" onClick={() => props.openMedia(media)}>
          <Icon as={BsCameraVideo} style={{ fontSize: '1.2em', paddingRight: '4px' }} />
          GIF
        </Tag>
      )
    case 'video':
      return (
        <Tag className="attachment" onClick={() => props.openMedia(media)}>
          <Icon as={BsCameraVideo} style={{ fontSize: '1.2em', paddingRight: '4px' }} />
          VIDEO
        </Tag>
      )
    case 'audio':
      return (
        <Tag className="attachment" onClick={() => props.openMedia(media)}>
          <Icon as={BsVolumeUp} style={{ fontSize: '1.2em', paddingRight: '4px' }} />
          AUDIO
        </Tag>
      )
    default:
      return (
        <div style={{ position: 'relative' }}>
          <IconButton
            icon={<Icon as={BsEyeSlash} />}
            size="sm"
            appearance="subtle"
            onClick={changeSensitive}
            style={{ position: 'absolute', top: '4px', left: '4px' }}
          />
          <Image
            width={128}
            height={128}
            src={media.preview_url}
            alt={media.description ? media.description : media.id}
            title={media.description ? media.description : media.id}
            onClick={() => props.openMedia(media)}
            style={{ objectFit: 'cover', cursor: 'pointer', borderRadius: '4px' }}
          />
        </div>
      )
  }
}

export default Attachments
