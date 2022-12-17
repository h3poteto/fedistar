import moment from 'moment'
import { HTMLAttributes } from 'react'

type Props = {
  time: string
  onClick?: (e: any) => void
} & HTMLAttributes<HTMLElement>

const parseDatetime = (timestamp: string) => {
  return moment(timestamp).fromNow(true)
}

const Time: React.FC<Props> = props => {
  return (
    <time
      dateTime={moment(props.time).format('YYYY-MM-DD HH:mm:ss')}
      title={moment(props.time).format('LLLL')}
      style={props.style}
      onClick={props.onClick}
    >
      {parseDatetime(props.time)}
    </time>
  )
}

export default Time
