import dayjs from 'dayjs'
// https://github.com/iamkun/dayjs/tree/dev/src/locale
import 'dayjs/locale/ja'
import 'dayjs/locale/it'
import 'dayjs/locale/pt-br'
import 'dayjs/locale/fr'
import 'dayjs/locale/de'
import relativeTime from 'dayjs/plugin/relativeTime'
import updateLocale from 'dayjs/plugin/updateLocale'
import { HTMLAttributes } from 'react'

type Props = {
  time: string
  onClick?: (e: any) => void
} & HTMLAttributes<HTMLElement>

const parseDatetime = (timestamp: string) => {
  dayjs.extend(updateLocale)
  dayjs.updateLocale('en', {
    relativeTime: {
      future: 'in %s',
      past: '%s ago',
      s: 'now',
      m: '%ds',
      mm: '%dm',
      h: '%dm',
      hh: '%dh',
      d: '%dh',
      dd: '%dd',
      M: 'a month',
      MM: '%d months',
      y: 'a year',
      yy: '%d years'
    }
  })
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
