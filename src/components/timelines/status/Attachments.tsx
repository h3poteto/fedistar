import Image from 'next/image'
import { Entity } from 'megalodon'
import { Button, IconButton } from 'rsuite'
import { Icon } from '@rsuite/icons'
import { BsCaretRightFill, BsVolumeUp } from 'react-icons/bs'
import { useState } from 'react'
import { FormattedMessage } from 'react-intl'
import emptyPreview from 'src/black.png'
import { ColumnWidth } from 'src/entities/timeline'
import ImageContextMenu from 'src/components/media/ImageContextMenu'

type Props = {
  attachments: Array<Entity.Attachment>
  sensitive: boolean
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
  columnWidth: ColumnWidth
}

const Attachments: React.FC<Props> = props => {
  const [sensitive, setSensitive] = useState<boolean>(props.sensitive)

  const changeSensitive = () => {
    setSensitive(current => !current)
  }

  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      {sensitive && (
        <Button appearance="default" block style={{ marginTop: '0.4em' }} onClick={changeSensitive}>
          <FormattedMessage id="timeline.status.media_hidden" />
        </Button>
      )}

      {!sensitive && (
        <AttachmentBox
          attachments={props.attachments}
          openMedia={props.openMedia}
          columnWidth={props.columnWidth}
        />
      )}
    </div>
  )
}

type AttachmentBoxProps = {
  attachments: Array<Entity.Attachment>
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
  columnWidth: ColumnWidth
}

function AttachmentBox(props: AttachmentBoxProps) {
  const thumbnailSize = props.columnWidth === 'lg' ? 144 : 128
  const gap = 8
  const visibleAttachments = props.attachments.slice(0, Math.min(props.attachments.length, 4))
  const remains = Math.max(0, props.attachments.length - 4)

  const layout = (() => {
    switch (visibleAttachments.length) {
      case 2:
        return [
          { index: 0, columnSpan: 1 },
          { index: 1, columnSpan: 1 }
        ]
      case 3:
        return [
          { index: 0, columnSpan: 1 },
          { index: 1, columnSpan: 1 },
          { index: 2, columnSpan: 2 }
        ]
      default:
        return visibleAttachments.map((_, index) => ({ index, columnSpan: 1 }))
    }
  })()

  const columns = visibleAttachments.length > 1 ? 2 : 1

  return (
    <div
      style={{
        display: 'grid',
        gridTemplateColumns: `repeat(${columns}, ${thumbnailSize}px)`,
        gridAutoRows: `${thumbnailSize}px`,
        gap: `${gap}px`,
        marginTop: '4px'
      }}
    >
      {layout.map(item => (
        <div key={item.index} style={{ gridColumn: `span ${item.columnSpan}` }}>
          <Attachment
            media={visibleAttachments[item.index]}
            remains={remains > 0 && item.index === visibleAttachments.length - 1 ? remains : 0}
            openMedia={() => props.openMedia(props.attachments, item.index)}
          />
        </div>
      ))}
    </div>
  )
}

type AttachmentProps = {
  media: Entity.Attachment
  remains: number
  openMedia: (media: Entity.Attachment) => void
}

const Attachment: React.FC<AttachmentProps> = props => {
  const { media, remains } = props

  return (
    <div style={{ position: 'relative', width: '100%', height: '100%' }}>
      {(media.type === 'gifv' || media.type === 'video') && (
        <IconButton
          icon={<Icon as={BsCaretRightFill} />}
          circle
          onClick={() => props.openMedia(media)}
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        />
      )}
      {media.type === 'audio' && (
        <IconButton
          icon={<Icon as={BsVolumeUp} />}
          circle
          onClick={() => props.openMedia(media)}
          style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)' }}
        />
      )}
      {media.type === 'image' ? (
        <ImageContextMenu imageUrl={media.url}>
          <div style={{ position: 'relative', width: '100%', height: '100%' }}>
            <Image
              fill
              src={previewImage(media)}
              alt={media.description ? media.description : media.id}
              title={media.description ? media.description : media.id}
              onClick={() => props.openMedia(media)}
              style={{ objectFit: 'cover', cursor: 'pointer', borderRadius: '4px' }}
            />
            {remains > 0 && (
              <div
                onClick={() => props.openMedia(media)}
                style={{
                  position: 'absolute',
                  inset: 0,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: 'rgba(0, 0, 0, 0.55)',
                  color: '#fff',
                  fontSize: '1.4em',
                  cursor: 'pointer',
                  borderRadius: '4px'
                }}
              >
                +{remains}
              </div>
            )}
          </div>
        </ImageContextMenu>
      ) : (
        <Image
          fill
          src={previewImage(media)}
          alt={media.description ? media.description : media.id}
          title={media.description ? media.description : media.id}
          onClick={() => props.openMedia(media)}
          style={{ objectFit: 'cover', cursor: 'pointer', borderRadius: '4px' }}
        />
      )}
    </div>
  )
}

const previewImage = (media: Entity.Attachment) => {
  if (media.preview_url && media.preview_url.length > 0) {
    switch (media.type) {
      case 'gifv':
      case 'video':
      case 'audio':
        return emptyPreview
      default:
        return media.preview_url
    }
  } else {
    return emptyPreview
  }
}

export default Attachments
