import { Entity, MegalodonInterface } from 'megalodon'
import { Server } from 'src/entities/server'
import { Timeline } from 'src/entities/timeline'
import ShowTimeline from 'src/components/timelines/Timeline'
import ShowNotifications from 'src/components/timelines/Notifications'
import ShowConversations from 'src/components/timelines/Conversations'
import { Unread } from 'src/entities/unread'

type Props = {
  timeline: Timeline
  server: Server
  unreads: Array<Unread>
  setUnreads: (a: Array<Unread>) => void
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
  setAccountDetail: (account: Entity.Account, server: Server, client: MegalodonInterface) => void
}

const Show: React.FC<Props> = props => {
  if (props.timeline.kind === 'notifications') {
    return (
      <ShowNotifications
        timeline={props.timeline}
        server={props.server}
        unreads={props.unreads}
        setUnreads={props.setUnreads}
        openMedia={props.openMedia}
        setAccountDetail={props.setAccountDetail}
      />
    )
  } else if (props.timeline.kind === 'direct') {
    return <ShowConversations server={props.server} timeline={props.timeline} openMedia={props.openMedia} />
  } else {
    return (
      <ShowTimeline timeline={props.timeline} server={props.server} openMedia={props.openMedia} setAccountDetail={props.setAccountDetail} />
    )
  }
}

export default Show
