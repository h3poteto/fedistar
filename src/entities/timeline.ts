export type Timeline = {
  id: number
  kind: TimelineKind
  name: string
  sort: number
  server_id: number
  list_id: string | null
  column_width: ColumnWidth
}

export type TimelineKind = 'home' | 'notifications' | 'local' | 'public' | 'favourites' | 'list' | 'bookmarks' | 'direct' | 'tag'
export type ColumnWidth = 'xs' | 'sm' | 'md' | 'lg'
