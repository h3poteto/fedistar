import { open } from '@tauri-apps/plugin-shell'
import { Entity } from 'megalodon'
import Image from 'next/image'
import { Panel } from 'rsuite'

import FailoverImg from 'src/utils/failoverImg'

type Props = {
  card: Entity.Card
}

const LinkPreview: React.FC<Props> = props => {
  const onClick = () => {
    open(props.card.url)
  }

  return (
    <Panel bordered bodyFill onClick={onClick} className="link-preview">
      <div style={{ display: 'flex', overflow: 'hidden' }}>
        <div style={{ width: '60px' }}>
          <Image width={60} height={60} src={FailoverImg(props.card.image)} alt={props.card.title} />
        </div>
        <div style={{ height: '60px', width: 'calc(100% - 60px)', overflow: 'hidden', paddingLeft: '4px' }}>
          <p style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={props.card.title}>
            <strong>{props.card.title}</strong>
          </p>
          <p style={{ textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }} title={props.card.description}>
            {props.card.description}
          </p>
        </div>
      </div>
    </Panel>
  )
}

export default LinkPreview
