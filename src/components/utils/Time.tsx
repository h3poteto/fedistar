import moment from 'moment'

type Props = {
  time: string
}

const parseDatetime = (timestamp: string) => {
  return moment(timestamp).fromNow(true)
}

const Time: React.FC<Props> = props => {
  return (
    <time dateTime={moment(props.time).format('YYYY-MM-DD HH:mm:ss')} title={moment(props.time).format('LLLL')}>
      {parseDatetime(props.time)}
    </time>
  )
}

export default Time
