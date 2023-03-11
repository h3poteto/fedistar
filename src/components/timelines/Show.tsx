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
  openReport: (status: Entity.Status, client: MegalodonInterface) => void
  openFromOtherAccount: (status: Entity.Status) => void
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
        openReport={props.openReport}
        openFromOtherAccount={props.openFromOtherAccount}
      />
    )
  } else if (props.timeline.kind === 'direct') {
    return <ShowConversations server={props.server} timeline={props.timeline} openMedia={props.openMedia} />
  } else {
    return (
      <ShowTimeline
        timeline={props.timeline}
        server={props.server}
        openMedia={props.openMedia}
        openReport={props.openReport}
        openFromOtherAccount={props.openFromOtherAccount}
      />
    )
  }
}

export default Show
