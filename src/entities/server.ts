import { Account } from './account'

export type Server = {
  id: number
  domain: string
  base_url: string
  sns: 'mastodon' | 'pleroma' | 'friendica' | 'firefish'
  favicon: string | null
  account_id: number | null
}

export type ServerSet = {
  server: Server
  account: Account | null
}
