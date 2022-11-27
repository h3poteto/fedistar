import Image from 'next/image'
import { Entity } from 'megalodon'

type Props = {
  attachments: Array<Entity.Attachment>
  openMedia: (media: Entity.Attachment) => void
}

// こいつをstatusにattachしてしまうと，statusの更新があったときに消えてしまう
// もちろん何か操作してるときにTLを更新しないでほしいというのはあるので，それはそれで対処するのだが
// その前にこの仕様は非常にやっかいである
// 面倒だがmodalは全部トップに寄せないとだめなんだろう
const Attachments: React.FC<Props> = props => {
  return (
    <div style={{ display: 'flex', flexWrap: 'wrap' }}>
      {props.attachments.map((media, index) => (
        <div key={index} style={{ margin: '4px' }}>
          <Image width={128} height={128} objectFit="cover" src={media.preview_url} onClick={() => props.openMedia(media)} />
        </div>
      ))}
    </div>
  )
}

export default Attachments
