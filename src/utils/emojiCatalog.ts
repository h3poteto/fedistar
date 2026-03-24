import { invoke } from '@tauri-apps/api/core'
import { EmojiCatalogEntry } from 'src/entities/emojiCatalog'
import { domainFromAcct } from 'src/utils/domain'

type CatalogMap = Record<string, Record<string, string>>

let emojiCatalogs: CatalogMap = {}

const normalizeDomain = (value?: string | null): string | null => {
  if (!value) return null
  const trimmed = value.trim().toLowerCase()
  if (!trimmed) return null
  return trimmed.includes('@') ? domainFromAcct(trimmed) : trimmed
}

export const setEmojiCatalogEntries = (entries: Array<EmojiCatalogEntry>) => {
  const next: CatalogMap = {}
  entries.forEach(entry => {
    const domain = normalizeDomain(entry.source_domain)
    if (!domain) return
    if (!next[domain]) {
      next[domain] = {}
    }
    next[domain][entry.shortcode] = entry.static_url || entry.image_url
  })
  emojiCatalogs = next
}

export const loadEmojiCatalogEntries = async () => {
  const entries = await invoke<Array<EmojiCatalogEntry>>('list_emoji_catalog_entries')
  setEmojiCatalogEntries(entries)
}

export const refreshEmojiCatalogEntries = async () => {
  await invoke('refresh_emoji_catalogs')
  await loadEmojiCatalogEntries()
}

export const resolveEmojiCatalogUrl = (shortcode: string, originHint?: string | null): string | null => {
  const domain = normalizeDomain(originHint)
  if (!domain) return null
  return emojiCatalogs[domain]?.[shortcode] || null
}
