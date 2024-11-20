import { createContext, useState, useEffect } from 'react'
import { CustomProvider, CustomProviderProps } from 'rsuite'
import { invoke } from '@tauri-apps/api/core'
import { listen } from '@tauri-apps/api/event'
import { Settings } from 'src/entities/settings'
import { UpdatedSettingsPayload } from 'src/payload'

type Props = {
  children: React.ReactNode
}

const initValue: CustomProviderProps = {
  theme: 'dark'
}

export const Context = createContext(initValue)

export const RsuiteProviderWrapper: React.FC<Props> = props => {
  const [theme, setTheme] = useState<'dark' | 'light' | 'high-contrast'>('dark')
  useEffect(() => {
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
    <Context.Provider value={{ theme }}>
      <CustomProvider theme={theme}>{props.children}</CustomProvider>
    </Context.Provider>
  )
}
