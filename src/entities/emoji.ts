export type CustomEmojiCategory = {
  id: string
  name: string
  emojis: Array<CustomEmoji>
}

export type CustomEmoji = {
  id: string
  name: string
  keywords: Array<string>
  skins: Array<{ src: string }>
}
