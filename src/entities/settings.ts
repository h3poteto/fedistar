import { localeType } from 'src/i18n'

export type Settings = {
  appearance: {
    font_size: number
    font_family: string | null
    language: localeType
    color_theme: ThemeType
  }
  app_menu?: {
    hidden: boolean
  }
}

export type ThemeType = 'dark' | 'light' | 'high-contrast'
