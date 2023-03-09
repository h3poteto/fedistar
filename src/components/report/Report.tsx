import { Entity, MegalodonInterface } from 'megalodon'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from 'rsuite'
import Category from './Category'
import Rules from './Rules'
import Statuses from './Statuses'
import Comment from './Comment'

type Props = {
  opened: boolean
  status: Entity.Status
  client: MegalodonInterface
  close: () => void
}

export default function Report(props: Props) {
  const { t } = useTranslation()
  const [category, setCategory] = useState<Entity.Category | null>(null)
  const [rules, setRules] = useState<Array<string> | null>(null)
  const [statuses, setStatuses] = useState<Array<string> | null>(null)
  const [comment, setComment] = useState<string | null>(null)
  const [forward, setForward] = useState(true)

  const reset = () => {
    setRules(null)
    setCategory(null)
    setStatuses(null)
    setComment(null)
    setForward(true)
  }

  const body = () => {
    if (category === null) {
      return <Category next={(category: Entity.Category) => setCategory(category)} />
    } else if (rules === null && category === 'violation') {
      return <Rules client={props.client} next={(rules: Array<string>) => setRules(rules)} />
    } else if (statuses === null) {
      return <Statuses account={props.status.account} client={props.client} next={(statuses: Array<string>) => setStatuses(statuses)} />
    } else if (comment === null) {
      return (
        <Comment
          next={(comment: string, forward: boolean) => {
            setForward(forward)
            setComment(comment)
            console.log('submit')
          }}
        />
      )
    }
  }

  if (props.status) {
    return (
      <Modal
        size="sm"
        open={props.opened}
        onClose={() => {
          reset()
          props.close()
        }}
      >
        <Modal.Header>{t('report.title', { user: '@' + props.status.account.acct })}</Modal.Header>
        {body()}
      </Modal>
    )
  } else {
    return <></>
  }
}
