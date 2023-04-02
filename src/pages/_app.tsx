import type { AppProps } from 'next/app'
import { CustomProvider } from 'rsuite'

import '../style.css'
import '../App.scss'

import '../i18n'

// This default export is required in a new `pages/_app.js` file.
export default function MyApp({ Component, pageProps }: AppProps) {
  return (
    <CustomProvider theme="dark">
      <Component {...pageProps} />
    </CustomProvider>
  )
}
