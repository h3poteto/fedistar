import { useRouter } from 'next/router'
import { Dispatch, useEffect, useState } from 'react'
import { Animation, Container } from 'rsuite'

import Status from './Status'
import Profile from './Profile'
import { Entity, MegalodonInterface } from 'megalodon'
import TagDetail from './Tag'
import ListsDetail from './Lists'
import ListDetail from './List'
import FollowedHashtags from './FollowedHashtags'

type Props = {
  dispatch: Dispatch<{ target: string; value: boolean; object?: any; index?: number }>
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
  openReport: (status: Entity.Status, client: MegalodonInterface) => void
  openFromOtherAccount: (status: Entity.Status) => void
  openListMemberships: (list: Entity.List, client: MegalodonInterface) => void
  openAddListMember: (user: Entity.Account, client: MegalodonInterface) => void
  locale: string
}

const Detail: React.FC<Props> = props => {
  const [target, setTarget] = useState<'status' | 'profile' | 'tag' | 'lists' | 'list' | 'followed_hashtags' | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (router.query.status_id) {
      setTarget('status')
    } else if (router.query.user_id) {
      setTarget('profile')
    } else if (router.query.tag) {
      setTarget('tag')
    } else if (router.query.lists === 'all') {
      setTarget('lists')
    } else if (router.query.list_id) {
      setTarget('list')
    } else if (router.query.followed_hashtags === 'all') {
      setTarget('followed_hashtags')
    } else {
      setTarget(null)
    }
  }, [router.query])

  return (
    <Animation.Transition
      in={target !== null}
      exitedClassName="detail-exited"
      exitingClassName="detail-exiting"
      enteredClassName="detail-entered"
      enteringClassName="detail-entering"
    >
      {(p, ref) => (
        <div {...p} ref={ref}>
          <Container className="profile" style={{ height: '100%', borderLeft: '1px solid var(--rs-border-primary)', overflow: 'hidden' }}>
            {target === 'status' && (
              <Status
                openMedia={(media: Array<Entity.Attachment>, index: number) =>
                  props.dispatch({ target: 'media', value: true, object: media, index: index })
                }
                openReport={props.openReport}
                openFromOtherAccount={props.openFromOtherAccount}
                locale={props.locale}
              />
            )}
            {target === 'profile' && (
              <Profile
                openMedia={props.openMedia}
                openReport={props.openReport}
                openFromOtherAccount={props.openFromOtherAccount}
                openAddListMember={props.openAddListMember}
                locale={props.locale}
              />
            )}
            {target === 'tag' && (
              <TagDetail
                openMedia={props.openMedia}
                openReport={props.openReport}
                openFromOtherAccount={props.openFromOtherAccount}
                locale={props.locale}
              />
            )}
            {target === 'lists' && <ListsDetail openListMemberships={props.openListMemberships} />}
            {target === 'list' && (
              <ListDetail
                openMedia={props.openMedia}
                openReport={props.openReport}
                openFromOtherAccount={props.openFromOtherAccount}
                locale={props.locale}
              />
            )}
            {target === 'followed_hashtags' && <FollowedHashtags />}
          </Container>
        </div>
      )}
    </Animation.Transition>
  )
}

export default Detail
