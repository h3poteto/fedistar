import { Entity, MegalodonInterface } from 'megalodon'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from 'rsuite'
import Category from './report/Category'
import Rules from './report/Rules'
import Statuses from './report/Statuses'

type Props = {
  opened: boolean
  status: Entity.Status
  client: MegalodonInterface
  close: () => void
}

export default function Report(props: Props) {
  const { t } = useTranslation()
  const [category, setCategory] = useState<Entity.Category>()
  const [rules, setRules] = useState<Array<string>>()
  const [statuses, setStatuses] = useState<Array<string>>()

  const reset = () => {
    setRules(undefined)
    setCategory(undefined)
    setStatuses(undefined)
  }

  const body = () => {
    if (category === undefined) {
      return <Category next={(category: Entity.Category) => setCategory(category)} />
    } else if (rules === undefined && category === 'violation') {
      return <Rules client={props.client} next={(rules: Array<string>) => setRules(rules)} />
    } else if (statuses === undefined) {
      return <Statuses account={props.status.account} client={props.client} next={(statuses: Array<string>) => setStatuses(statuses)} />
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
