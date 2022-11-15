import { Server } from 'src/entities/server'
import { Timeline } from 'src/entities/timeline'
import ShowTimeline from 'src/components/timeline/Timeline'
import ShowNotifications from 'src/components/timeline/Notifications'

type Props = {
  timeline: Timeline
  server: Server
}

const Show: React.FC<Props> = props => {
  if (props.timeline.timeline === 'notifications') {
    return <ShowNotifications timeline={props.timeline} server={props.server} />
  } else {
    return <ShowTimeline timeline={props.timeline} server={props.server} />
  }
}

export default Show
