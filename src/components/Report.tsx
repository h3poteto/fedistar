import { Entity } from 'megalodon'
import { useTranslation } from 'react-i18next'
import { Modal } from 'rsuite'

type Props = {
  opened: boolean
  status: Entity.Status
  close: () => void
}
export default function Report(props: Props) {
  const { t } = useTranslation()

  if (props.status) {
    return (
      <Modal
        open={props.opened}
        onClose={() => {
          props.close()
        }}
      >
        <Modal.Header>{t('report.title', { user: props.status.account.acct })}</Modal.Header>
        <Modal.Body>
          <Modal.Title>{t('report.category.title')}</Modal.Title>
          <p>{t('report.category.description')}</p>
        </Modal.Body>
      </Modal>
    )
  } else {
    return <></>
  }
}
