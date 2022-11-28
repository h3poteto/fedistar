import Image from 'next/image'
import { Entity } from 'megalodon'

type Props = {
  attachments: Array<Entity.Attachment>
  openMedia: (media: Entity.Attachment) => void
}

const Attachments: React.FC<Props> = props => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      {props.attachments.map((media, index) => (
        <div key={index} style={{ margin: '4px' }}>
          <Image
            width={128}
            height={128}
            src={media.preview_url}
            alt={media.description ? media.description : media.id}
            onClick={() => props.openMedia(media)}
            style={{ objectFit: 'cover' }}
          />
        </div>
      ))}
    </div>
  )
}

export default Attachments
