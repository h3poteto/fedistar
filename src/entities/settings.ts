import { localeType } from 'src/i18n'

export type Settings = {
  appearance: {
    font_size: number
    language: localeType
    color_theme: ThemeType
  }
}

export type ThemeType = 'dark' | 'light' | 'high-contrast'
