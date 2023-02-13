import type { AppProps } from 'next/app'
import { CustomProvider } from 'rsuite'
import dayjs from 'dayjs'
import 'dayjs/locale/ja'
import 'dayjs/locale/en'
import updateLocale from 'dayjs/plugin/updateLocale'

import '../style.css'
import '../App.css'

import '../i18n'

// This default export is required in a new `pages/_app.js` file.
export default function MyApp({ Component, pageProps }: AppProps) {
  dayjs.extend(updateLocale)
  dayjs.updateLocale('en', {
    relativeTime: {
      future: 'in %s',
      past: '%s ago',
      s: 'now',
      m: '%ds',
      mm: '%dm',
      h: '%dh',
      hh: '%dh',
      d: '%dd',
      dd: '%dd',
      M: 'a month',
      MM: '%d months',
      y: 'a year',
      yy: '%d years'
    }
  })

  return (
    <CustomProvider theme="dark">
      <Component {...pageProps} />
    </CustomProvider>
  )
}
