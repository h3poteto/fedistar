import type { AppProps } from 'next/app'
import { CustomProvider } from 'rsuite'

import '../style.css'
import '../App.scss'

import { invoke } from '@tauri-apps/api/tauri'
import { useEffect, useState } from 'react'
import { IntlProviderWrapper } from 'src/i18n'
import { listen } from '@tauri-apps/api/event'
import { UpdatedSettingsPayload } from 'src/payload'
import { Settings } from 'src/entities/settings'

// This default export is required in a new `pages/_app.js` file.
export default function MyApp({ Component, pageProps }: AppProps) {
  const [theme, setTheme] = useState<'dark' | 'light' | 'high-contrast'>('dark')
  useEffect(() => {
    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      invoke('frontend_log', { level: 'error', message: event.reason.toString() })
    })
    window.addEventListener('error', (event: ErrorEvent) => {
      invoke('frontend_log', { level: 'error', message: event.message.toString() })
    })

    listen<UpdatedSettingsPayload>('updated-settings', () => {
      loadTheme()
    })

    loadTheme()
  }, [])

  const loadTheme = () => {
    invoke<Settings>('read_settings').then(res => {
      setTheme(res.appearance.color_theme)
    })
  }

  return (
    <CustomProvider theme={theme}>
      <IntlProviderWrapper>
        <Component {...pageProps} />
      </IntlProviderWrapper>
    </CustomProvider>
  )
}
