export type Timeline = {
  id: number
  kind: TimelineKind
  name: string
  sort: number
  server_id: number
  list_id: string | null
}

export type TimelineKind = 'home' | 'notifications' | 'local' | 'public' | 'favourites' | 'list'
