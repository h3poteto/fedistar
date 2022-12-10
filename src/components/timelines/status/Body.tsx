import { Entity } from 'megalodon'
import { useState } from 'react'
import { Button } from 'rsuite'
import emojify from 'src/utils/emojify'

type Props = {
  status: Entity.Status
  onClick: (e: any) => void
}

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
    <div>
      {spoiler()}
      {!spoilered && (
        <div
          className="status-body"
          style={{ wordWrap: 'break-word' }}
          dangerouslySetInnerHTML={{ __html: emojify(props.status.content, props.status.emojis) }}
          onClick={props.onClick}
        />
      )}
    </div>
  )
}

export default Body
