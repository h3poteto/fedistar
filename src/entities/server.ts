export type Server = {
  id: number
  domain: string
  base_url: string
  sns: 'mastodon' | 'pleroma' | 'misskey'
  favicon: string | null
  account_id: number | null
}
