import Image from 'next/image'
import { Entity } from 'megalodon'
import { Button, IconButton } from 'rsuite'
import { Icon } from '@rsuite/icons'
import { BsEyeSlash, BsCaretRightFill, BsVolumeUp, BsBoxArrowUpRight } from 'react-icons/bs'
import { useEffect, useState } from 'react'
import { FormattedMessage } from 'react-intl'
import emptyPreview from 'src/black.png'
import { ColumnWidth } from 'src/entities/timeline'
import { invoke } from '@tauri-apps/api/core'

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
          changeSensitive={changeSensitive}
          columnWidth={props.columnWidth}
        />
      )}
    </div>
  )
}

type AttachmentBoxProps = {
  attachments: Array<Entity.Attachment>
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
  changeSensitive: () => void
  columnWidth: ColumnWidth
}

function AttachmentBox(props: AttachmentBoxProps) {
  const [max, setMax] = useState(1)
  const [remains, setRemains] = useState(0)

  useEffect(() => {
    let m = 1
    switch (props.columnWidth) {
      case 'xs':
      case 'sm':
        m = 1
        break
      case 'md':
      case 'lg':
        m = 2
        break
    }
    setMax(m)
    const length = props.attachments.length
    setRemains(length - m)
  }, [props.attachments, props.columnWidth])

  return (
    <>
      <div style={{ display: 'flex' }}>
        {props.attachments
          .filter((_, index) => index < max)
          .map((media, index) => (
            <div key={index} style={{ margin: '4px' }}>
              <Attachment
                media={media}
                changeSensitive={props.changeSensitive}
                openMedia={() => props.openMedia(props.attachments, index)}
              />
            </div>
          ))}
        {remains > 0 && (
          <div style={{ position: 'relative', margin: '4px', overflow: 'hidden' }}>
            <div
              style={{
                position: 'absolute',
                top: '50%',
                left: '50%',
                transform: 'translate(-50%, -50%)',
                fontSize: '1.4em',
                cursor: 'pointer'
              }}
            >
              +{remains}
            </div>
            <Image
              width={62}
              height={128}
              src={emptyPreview}
              alt="More attachments"
              title="More attachments"
              onClick={() => props.openMedia(props.attachments, max)}
              style={{ objectFit: 'cover', cursor: 'pointer', borderRadius: '4px' }}
            />
          </div>
        )}
      </div>
    </>
  )
}

type AttachmentProps = {
  media: Entity.Attachment
  openMedia: (media: Entity.Attachment) => void
  changeSensitive: () => void
}

const Attachment: React.FC<AttachmentProps> = props => {
  const { media, changeSensitive } = props

  const externalWindow = async (url: string) => {
    await invoke('open_media', { mediaUrl: url })
  }

  return (
    <div style={{ position: 'relative' }}>
      <IconButton
        icon={<Icon as={BsEyeSlash} />}
        size="sm"
        appearance="subtle"
        onClick={changeSensitive}
        style={{ position: 'absolute', top: '4px', left: '4px' }}
      />
      <IconButton
        icon={<Icon as={BsBoxArrowUpRight} />}
        size="sm"
        appearance="subtle"
        onClick={() => externalWindow(media.url)}
        style={{ position: 'absolute', top: '4px', right: '4px' }}
      />
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

      <Image
        width={128}
        height={128}
        src={previewImage(media)}
        alt={media.description ? media.description : media.id}
        title={media.description ? media.description : media.id}
        onClick={() => props.openMedia(media)}
        style={{ objectFit: 'cover', cursor: 'pointer', borderRadius: '4px' }}
      />
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
