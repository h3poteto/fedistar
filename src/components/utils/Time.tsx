import dayjs from 'dayjs'
import relativeTime from 'dayjs/plugin/relativeTime'
import { HTMLAttributes } from 'react'

type Props = {
  time: string
  onClick?: (e: any) => void
} & HTMLAttributes<HTMLElement>

const parseDatetime = (timestamp: string) => {
  dayjs.extend(relativeTime)
  return dayjs(timestamp).fromNow(true)
}

const Time: React.FC<Props> = props => {
  return (
    <time
      dateTime={dayjs(props.time).format('YYYY-MM-DD HH:mm:ss')}
      title={dayjs(props.time).format('MM/DD HH:mm:ss')}
      style={props.style}
      onClick={props.onClick}
    >
      {parseDatetime(props.time)}
    </time>
  )
}

export default Time
