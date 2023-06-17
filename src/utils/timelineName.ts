import { TFunction } from 'i18next'
import { TimelineKind } from 'src/entities/timeline'

const timelineName = (timelineKind: TimelineKind, name: string, t: TFunction<'translation', undefined>) => {
  switch (timelineKind) {
    case 'home':
      return t('timeline.home')
    case 'notifications':
      return t('timeline.notifications')
    case 'favourites':
      return t('timeline.favourites')
    case 'bookmarks':
      return t('timeline.bookmarks')
    case 'direct':
      return t('timeline.direct')
    case 'local':
      return t('timeline.local')
    case 'public':
      return t('timeline.public')
    default:
      return name
  }
}

export default timelineName
