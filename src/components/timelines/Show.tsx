import { Entity, MegalodonInterface } from 'megalodon'
import { Server } from 'src/entities/server'
import { Timeline } from 'src/entities/timeline'
import ShowTimeline from 'src/components/timelines/Timeline'
import ShowNotifications from 'src/components/timelines/Notifications'
import { Unread } from 'src/entities/unread'

type Props = {
  timeline: Timeline
  server: Server
  unreads: Array<Unread>
  setUnreads: (a: Array<Unread>) => void
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
  setStatusDetail: (status: Entity.Status, server: Server, client: MegalodonInterface) => void
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
        setStatusDetail={props.setStatusDetail}
      />
    )
  } else {
    return (
      <ShowTimeline
        timeline={props.timeline}
        server={props.server}
        openMedia={props.openMedia}
        setStatusDetail={props.setStatusDetail}
        setAccountDetail={props.setAccountDetail}
      />
    )
  }
}

export default Show
