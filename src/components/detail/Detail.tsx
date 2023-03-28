import { useRouter } from 'next/router'
import { Dispatch, useEffect, useState } from 'react'
import { Animation, Container } from 'rsuite'

import Status from './Status'
import Profile from './Profile'
import { MegalodonInterface } from 'megalodon'
import TagDetail from './Tag'

type Props = {
  dispatch: Dispatch<{ target: string; value: boolean; object?: any; index?: number }>
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
  openReport: (status: Entity.Status, client: MegalodonInterface) => void
  openFromOtherAccount: (status: Entity.Status) => void
}

const Detail: React.FC<Props> = props => {
  const [target, setTarget] = useState<'status' | 'profile' | 'tag' | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (router.query.status_id) {
      setTarget('status')
    } else if (router.query.user_id) {
      setTarget('profile')
    } else if (router.query.tag) {
      setTarget('tag')
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
          <Container className="profile" style={{ height: '100%', borderLeft: '1px solid var(--rs-gray-600)', overflow: 'hidden' }}>
            {target === 'status' && (
              <Status
                openMedia={(media: Array<Entity.Attachment>, index: number) =>
                  props.dispatch({ target: 'media', value: true, object: media, index: index })
                }
                openReport={props.openReport}
                openFromOtherAccount={props.openFromOtherAccount}
              />
            )}
            {target === 'profile' && (
              <Profile openMedia={props.openMedia} openReport={props.openReport} openFromOtherAccount={props.openFromOtherAccount} />
            )}
            {target === 'tag' && (
              <TagDetail openMedia={props.openMedia} openReport={props.openReport} openFromOtherAccount={props.openFromOtherAccount} />
            )}
          </Container>
        </div>
      )}
    </Animation.Transition>
  )
}

export default Detail
