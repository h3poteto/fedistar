import type { AppProps } from 'next/app'

import '../style.css'
import '../App.scss'

import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { useEffect, useState } from 'react'
import { IntlProviderWrapper } from 'src/i18n'
import { RsuiteProviderWrapper } from 'src/theme'
import { refreshEmojiCatalogEntries } from 'src/utils/emojiCatalog'

// This default export is required in a new `pages/_app.js` file.
export default function MyApp({ Component, pageProps }: AppProps) {
  const [emojiCatalogVersion, setEmojiCatalogVersion] = useState(0)

  useEffect(() => {
    let disposed = false
    let unlistenUpdatedServers: (() => void) | null = null

    const loadEmojiCatalogs = async () => {
      try {
        await refreshEmojiCatalogEntries()
        if (!disposed) {
          setEmojiCatalogVersion(current => current + 1)
        }
      } catch (err) {
        console.error(err)
      }
    }

    window.addEventListener('unhandledrejection', (event: PromiseRejectionEvent) => {
      invoke('frontend_log', { level: 'error', message: event.reason.toString() })
    })
    window.addEventListener('error', (event: ErrorEvent) => {
      invoke('frontend_log', { level: 'error', message: event.message.toString() })
    })
    loadEmojiCatalogs()
    listen('updated-servers', () => {
      loadEmojiCatalogs()
    }).then(fn => {
      unlistenUpdatedServers = fn
    })

    return () => {
      disposed = true
      if (unlistenUpdatedServers) {
        unlistenUpdatedServers()
      }
    }
  }, [])

  return (
    <RsuiteProviderWrapper>
      <IntlProviderWrapper>
        <Component key={emojiCatalogVersion} {...pageProps} />
      </IntlProviderWrapper>
    </RsuiteProviderWrapper>
  )
}
