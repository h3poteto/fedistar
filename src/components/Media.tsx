import { Button, FlexboxGrid, Modal } from 'rsuite'
import { Entity } from 'megalodon'
import { MouseEvent, ReactElement, useCallback, useEffect, useState } from 'react'
import { Icon } from '@rsuite/icons'
import { BsChevronRight, BsChevronLeft } from 'react-icons/bs'
import ImageContextMenu from 'src/components/media/ImageContextMenu'

type Props = {
  index: number
  media: Array<Entity.Attachment>
  opened: boolean
  close: () => void
}

const Media: React.FC<Props> = props => {
  const [index, setIndex] = useState<number>(0)
  const showNavigation = props.media.length > 1

  useEffect(() => {
    setIndex(props.index)
  }, [props.index])

  useEffect(() => {
    if (!props.opened || !props.media[index]) {
      return
    }

    preloadImage(props.media[index].url)
    if (props.media[index + 1]) {
      preloadImage(props.media[index + 1].url)
    }
    if (props.media[index - 1]) {
      preloadImage(props.media[index - 1].url)
    }
  }, [index, props.media, props.opened])

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

  const handleKeyPress = useCallback(
    (event: KeyboardEvent) => {
      if (props.opened) {
        if (event.key === 'ArrowLeft') {
          previous()
        } else if (event.key === 'ArrowRight') {
          next()
        }
      }
    },
    [props.opened, previous, next]
  )

  useEffect(() => {
    document.addEventListener('keydown', handleKeyPress)

    return () => {
      document.removeEventListener('keydown', handleKeyPress)
    }
  }, [handleKeyPress])

  const close = useCallback(() => {
    props.close()
    setIndex(0)
  }, [props])

  const stopPropagation = (event: MouseEvent<HTMLElement>) => {
    event.stopPropagation()
  }

  return (
    <Modal
      open={props.opened}
      size="lg"
      onClose={close}
      style={{ height: 'calc(100% - 30px)' }}
      dialogClassName="media-dialog"
    >
      <Modal.Body style={{ height: '100%' }} onClick={close}>
        <div className="media-stage">
          {showNavigation && (
            <Button
              appearance="link"
              className="media-nav media-nav-left"
              disabled={index < 1}
              onClick={event => {
                stopPropagation(event)
                previous()
              }}
            >
              <Icon as={BsChevronLeft} style={{ fontSize: '1.5em' }} />
            </Button>
          )}
          <div className="media-asset" onClick={stopPropagation}>
            {props.media[index] && mediaComponent(props.media[index])}
          </div>
          {showNavigation && (
            <Button
              appearance="link"
              className="media-nav media-nav-right"
              disabled={index >= props.media.length - 1}
              onClick={event => {
                stopPropagation(event)
                next()
              }}
            >
              <Icon as={BsChevronRight} style={{ fontSize: '1.5em' }} />
            </Button>
          )}
        </div>
      </Modal.Body>
    </Modal>
  )
}

const preloadImage = (src: string) => {
  const image = new window.Image()
  image.decoding = 'async'
  image.src = src
}

const LightboxImage: React.FC<{ media: Entity.Attachment }> = ({ media }) => {
  const [loaded, setLoaded] = useState(false)
  const mediaAlt = media.description ? media.description : media.id

  useEffect(() => {
    setLoaded(false)
  }, [media.url])

  return (
    <ImageContextMenu imageUrl={media.url}>
      <div className="media-frame">
        {media.preview_url && media.preview_url.length > 0 && (
          <img
            src={media.preview_url}
            alt={mediaAlt}
            title={mediaAlt}
            className={`media-content media-preview ${loaded ? 'media-hidden' : ''}`}
            draggable={false}
          />
        )}
        <img
          src={media.url}
          alt={mediaAlt}
          title={mediaAlt}
          className={`media-content media-full ${loaded ? 'media-loaded' : ''}`}
          loading="eager"
          fetchPriority="high"
          draggable={false}
          onLoad={() => setLoaded(true)}
        />
      </div>
    </ImageContextMenu>
  )
}

const mediaComponent = (media: Entity.Attachment): ReactElement => {
  switch (media.type) {
    case 'gifv':
      return (
        <div className="media-frame">
          <video src={media.url} autoPlay loop className="media-content" />
        </div>
      )
    case 'video':
    case 'audio':
      return (
        <div className="media-frame">
          <video src={media.url} autoPlay loop controls className="media-content" />
        </div>
      )
    default:
      return <LightboxImage media={media} />
  }
}

export default Media
