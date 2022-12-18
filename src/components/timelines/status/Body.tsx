import { Entity } from 'megalodon'
import { HTMLAttributes, useState } from 'react'
import { Button } from 'rsuite'
import emojify from 'src/utils/emojify'
import LinkPreview from './LinkPreview'

type Props = {
  status: Entity.Status
  onClick: (e: any) => void
} & HTMLAttributes<HTMLElement>

const Body: React.FC<Props> = props => {
  const [spoilered, setSpoilered] = useState<boolean>(props.status.spoiler_text.length > 0)

  const spoiler = () => {
    if (props.status.spoiler_text.length > 0) {
      return (
        <div>
          <div
            className="spoiler-text"
            style={{ wordWrap: 'break-word' }}
            dangerouslySetInnerHTML={{ __html: emojify(props.status.spoiler_text, props.status.emojis) }}
            onClick={props.onClick}
          />
          <Button size="xs" onClick={() => setSpoilered(current => !current)}>
            {spoilered ? 'Show more' : 'Show less'}
          </Button>
        </div>
      )
    } else {
      return null
    }
  }

  return (
    <div style={{ cursor: 'pointer' }}>
      {spoiler()}
      {!spoilered && (
        <div
          className="status-body"
          style={{ wordWrap: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: emojify(props.status.content, props.status.emojis) }}
          onClick={props.onClick}
        />
      )}
      {!spoilered && props.status.card && props.status.card.type === 'link' && <LinkPreview card={props.status.card} />}
    </div>
  )
}

export default Body
