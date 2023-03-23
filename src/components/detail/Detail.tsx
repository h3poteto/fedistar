import { useRouter } from 'next/router'
import { Dispatch, useEffect, useState } from 'react'
import { BsX, BsChevronLeft } from 'react-icons/bs'
import { Animation, Container, Header, FlexboxGrid, Button } from 'rsuite'
import { Icon } from '@rsuite/icons'

import Status from './Status'
import Profile from './Profile'
import { useTranslation } from 'react-i18next'
import { MegalodonInterface } from 'megalodon'
import TagDetail from './Tag'

type Props = {
  dispatch: Dispatch<{ target: string; value: boolean; object?: any; index?: number }>
  openMedia: (media: Array<Entity.Attachment>, index: number) => void
  openReport: (status: Entity.Status, client: MegalodonInterface) => void
  openFromOtherAccount: (status: Entity.Status) => void
}

const Detail: React.FC<Props> = props => {
  const { t } = useTranslation()

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

  const back = () => {
    router.back()
  }

  const close = () => {
    router.push({ query: {} })
  }

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
            <Header style={{ backgroundColor: 'var(--rs-gray-700)' }}>
              <FlexboxGrid justify="space-between">
                <FlexboxGrid.Item>
                  <Button appearance="link" onClick={back}>
                    <Icon as={BsChevronLeft} style={{ fontSize: '1.4em' }} />
                    {t('detail.back')}
                  </Button>
                </FlexboxGrid.Item>
                <FlexboxGrid.Item>
                  <Button appearance="link" onClick={close}>
                    <Icon as={BsX} style={{ fontSize: '1.4em' }} />
                  </Button>
                </FlexboxGrid.Item>
              </FlexboxGrid>
            </Header>
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
            {target === 'tag' && <TagDetail />}
          </Container>
        </div>
      )}
    </Animation.Transition>
  )
}

export default Detail
