import { invoke } from '@tauri-apps/api/core'
import { Entity } from 'megalodon'
import { resolveEmojiCatalogUrl } from 'src/utils/emojiCatalog'

const imageTag = (shortcode: string, url: string) =>
  `<img draggable="false" class="emojione" alt="${shortcode}" title="${shortcode}" src="${url}" />`

const escapedShortcode = (shortcode: string) => shortcode.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')

const emojify = (str: string | any, customEmoji: Array<Entity.Emoji> = [], originHint?: string | null): string | null => {
  if (typeof str !== 'string') {
    const message = `Provided string is not a string: ${str}`
    console.error(message)
    invoke('frontend_log', { level: 'error', message: message })
    return null
  }
  let result = str
  const directEmoji = new Map<string, string>()
  customEmoji.map(emoji => {
    const url = (emoji as Entity.Emoji & { static_url?: string }).static_url || emoji.url
    directEmoji.set(emoji.shortcode, url)
    const reg = new RegExp(`:${escapedShortcode(emoji.shortcode)}:`, 'g')
    const match = result.match(reg)
    if (!match) return emoji
    const replaceTag = imageTag(emoji.shortcode, url)
    result = result.replace(reg, replaceTag)
    return emoji
  })

  result = result.replace(/:([a-zA-Z0-9_+-]+):/g, (matched, shortcode) => {
    if (directEmoji.has(shortcode)) {
      return imageTag(shortcode, directEmoji.get(shortcode))
    }
    const fallbackUrl = resolveEmojiCatalogUrl(shortcode, originHint)
    if (fallbackUrl) {
      return imageTag(shortcode, fallbackUrl)
    }
    return matched
  })

  return result
}

export default emojify
