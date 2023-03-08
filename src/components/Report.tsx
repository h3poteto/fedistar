import { Entity, MegalodonInterface } from 'megalodon'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal } from 'rsuite'
import Category from './report/Category'
import Rules from './report/Rules'

type Props = {
  opened: boolean
  status: Entity.Status
  client: MegalodonInterface
  close: () => void
}

export default function Report(props: Props) {
  const { t } = useTranslation()
  const [category, setCategory] = useState<Entity.Category>()
  const [rules, setRules] = useState<Array<string>>([])

  const reset = () => {
    setRules([])
    setCategory(undefined)
  }

  if (props.status) {
    return (
      <Modal
        open={props.opened}
        onClose={() => {
          reset()
          props.close()
        }}
      >
        <Modal.Header>{t('report.title', { user: props.status.account.acct })}</Modal.Header>
        <Modal.Body>
          {category === undefined && <Category next={(category: Entity.Category) => setCategory(category)} />}
          {category === 'violation' && <Rules client={props.client} next={(rules: Array<string>) => setRules(rules)} />}
        </Modal.Body>
      </Modal>
    )
  } else {
    return <></>
  }
}
