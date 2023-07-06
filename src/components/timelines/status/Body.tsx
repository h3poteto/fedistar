import { Entity } from 'megalodon'
import { HTMLAttributes, useState } from 'react'
import { FormattedMessage } from 'react-intl'
import { Button } from 'rsuite'
import emojify from 'src/utils/emojify'
import LinkPreview from './LinkPreview'

type Props = {
  status: Entity.Status
  onClick?: (e: any) => void
} & HTMLAttributes<HTMLElement>

const Body: React.FC<Props> = props => {
  const [spoilered, setSpoilered] = useState<boolean>(props.status.spoiler_text.length > 0)

  const spoiler = () => {
    if (props.status.spoiler_text.length > 0) {
      return (
        <div>
          <div
            className="spoiler-text"
            style={Object.assign({ wordWrap: 'break-word' }, props.style)}
            dangerouslySetInnerHTML={{ __html: emojify(props.status.spoiler_text, props.status.emojis) }}
            onClick={props.onClick}
          />
          <Button size="xs" onClick={() => setSpoilered(current => !current)}>
            {spoilered ? <FormattedMessage id="timeline.status.show_more" /> : <FormattedMessage id="timeline.status.show_less" />}
          </Button>
        </div>
      )
    } else {
      return null
    }
  }

  return (
    <div className="body">
      {spoiler()}
      {!spoilered && (
        <div
          className="status-body"
          style={Object.assign({ wordWrap: 'break-word' }, props.style)}
          dangerouslySetInnerHTML={{ __html: emojify(props.status.content, props.status.emojis) }}
          onClick={props.onClick}
        />
      )}
      {!spoilered && props.status.card && props.status.card.type === 'link' && <LinkPreview card={props.status.card} />}
    </div>
  )
}

export default Body
