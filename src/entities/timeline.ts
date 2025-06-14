export type Timeline = {
  id: number
  kind: TimelineKind
  name: string
  sort: number
  server_id: number
  list_id: string | null
  column_width: ColumnWidth
  show_boosts: boolean
  show_replies: boolean
}

export type TimelineKind = 'home' | 'notifications' | 'local' | 'public' | 'favourites' | 'list' | 'bookmarks' | 'direct' | 'tag'
export type ColumnWidth = 'xs' | 'sm' | 'md' | 'lg'

export function columnWidth(width: ColumnWidth) {
  switch (width) {
    case 'xs':
      return '280px'
    case 'sm':
      return '340px'
    case 'md':
      return '420px'
    case 'lg':
      return '500px'
    default:
      return '340px'
  }
}
