import type { AppProps } from 'next/app'
import { CustomProvider } from 'rsuite'
import moment from 'moment'

import '../style.css'
import '../App.css'

// This default export is required in a new `pages/_app.js` file.
export default function MyApp({ Component, pageProps }: AppProps) {
  moment.updateLocale('en', {
    relativeTime: {
      future: 'in %s',
      past: '%s ago',
      s: 'now',
      ss: '%ds',
      m: '%dm',
      mm: '%dm',
      h: '%dh',
      hh: '%dh',
      d: '%dd',
      dd: '%dd',
      w: '%dw',
      ww: '%dw',
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
