import type { AppProps } from 'next/app'
import { CustomProvider } from 'rsuite'

import '../style.css'
import '../App.scss'

import { invoke } from '@tauri-apps/api/tauri'
import { useEffect } from 'react'
import { IntlProvider } from 'react-intl'
import en from '../../locales/en/translation.json'
import { flattenMessages } from 'src/utils/flattenMessage'

// This default export is required in a new `pages/_app.js` file.
export default function MyApp({ Component, pageProps }: AppProps) {
  useEffect(() => {
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      invoke('frontend_log', { level: 'error', message: event.reason.toString() })
    })
    window.addEventListener('error', (event: ErrorEvent) => {
      invoke('frontend_log', { level: 'error', message: event.message.toString() })
    })
  }, [])

  return (
    <CustomProvider theme="dark">
      <IntlProvider locale="en" messages={flattenMessages(en)}>
        <Component {...pageProps} />
      </IntlProvider>
    </CustomProvider>
  )
}
