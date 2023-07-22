import en from '../locales/en/translation.json'
import ja from '../locales/ja/translation.json'
import it from '../locales/it/translation.json'
import pt_BR from '../locales/pt-BR/translation.json'
import fr from '../locales/fr/translation.json'
import { flattenMessages } from './utils/flattenMessage'
import { createContext, useState } from 'react'
import { IntlProvider } from 'react-intl'

export type localeType = 'en' | 'ja' | 'it' | 'pt-BR' | 'fr'

type Props = {
  children: React.ReactNode
}

interface Lang {
  switchLang(lang: string): void
}

export const Context = createContext<Lang>({} as Lang)

export const IntlProviderWrapper: React.FC<Props> = props => {
  const langs = [
    { locale: 'en', messages: flattenMessages(en) },
    { locale: 'ja', messages: flattenMessages(ja) },
    { locale: 'it', messages: flattenMessages(it) },
    { locale: 'pt-BR', messages: flattenMessages(pt_BR) },
    { locale: 'fr', messages: flattenMessages(fr) }
  ]
  const [lang, setLang] = useState(langs[0])

  const switchLang = (locale: string) => {
    const changeLang = langs.find(lang => lang.locale === locale)
    if (changeLang == null) {
      return
    }
    setLang(changeLang)
  }

  return (
    <Context.Provider value={{ switchLang }}>
      <IntlProvider {...lang} defaultLocale="en" fallbackOnEmptyString={true}>
        {props.children}
      </IntlProvider>
    </Context.Provider>
  )
}
