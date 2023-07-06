import type { AppProps } from 'next/app'
import { CustomProvider } from 'rsuite'

import '../style.css'
import '../App.scss'

import { invoke } from '@tauri-apps/api/tauri'
import { useEffect } from 'react'
import { IntlProviderWrapper } from 'src/i18n'

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
      <IntlProviderWrapper>
        <Component {...pageProps} />
      </IntlProviderWrapper>
    </CustomProvider>
  )
}
