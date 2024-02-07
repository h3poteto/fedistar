import { Entity } from 'megalodon'
import { CustomEmojiCategory } from 'src/entities/emoji'

export const data = async () => {
  const response = await fetch('https://cdn.jsdelivr.net/npm/@emoji-mart/data')

  return response.json()
}

export const mapCustomEmojiCategory = (domain: string, emojis: Array<Entity.Emoji>): Array<CustomEmojiCategory> => [
  {
    id: domain,
    name: domain,
    emojis: emojis
      .map(emoji => ({
        name: emoji.shortcode,
        image: emoji.url
      }))
      .filter((e, i, array) => array.findIndex(ar => e.name === ar.name) === i)
      .map(e => ({
        id: e.name,
        name: e.name,
        keywords: [e.name],
        skins: [{ src: e.image, shortcodes: `:${e.name}:` }]
      }))
  }
]
