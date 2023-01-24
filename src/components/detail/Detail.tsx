import { useRouter } from 'next/router'
import { Dispatch, useEffect, useState } from 'react'
import { Animation } from 'rsuite'

import Status from './Status'
import Profile from './Profile'

type Props = {
  dispatch: Dispatch<{ target: string; value: boolean; object?: any; index?: number }>
}

const Detail: React.FC<Props> = props => {
  const [target, setTarget] = useState<'status' | 'profile' | null>(null)
  const router = useRouter()

  useEffect(() => {
    if (router.query.status_id) {
      setTarget('status')
    } else if (router.query.user_id) {
      setTarget('profile')
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
        <div {...p} ref={ref} style={{ overflow: 'hidden' }}>
          {target === 'status' && (
            <Status
              openMedia={(media: Array<Entity.Attachment>, index: number) =>
                props.dispatch({ target: 'media', value: true, object: media, index: index })
              }
            />
          )}
          {target === 'profile' && <Profile />}
        </div>
      )}
    </Animation.Transition>
  )
}

export default Detail
