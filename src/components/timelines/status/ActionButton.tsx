import { ReactElement, HTMLAttributes, useState } from 'react'
import { FormattedMessage } from 'react-intl'
import { Button, IconButton, Modal } from 'rsuite'

type Props = {
  icon: ReactElement
  onClick?: () => void
  disabled?: boolean
  className?: string
  activating?: boolean
  deactivating?: boolean
  confirm?: boolean
  confirmText?: string
} & HTMLAttributes<HTMLElement>

const ActionButton: React.FC<Props> = props => {
  const [confirmOpen, setConfirmOpen] = useState(false)

  const className = () => {
    if (props.activating) {
      return 'activating'
    } else if (props.deactivating) {
      return 'deactivating'
    } else {
      return ''
    }
  }

  const handleClick = () => {
    if (props.confirm) {
      setConfirmOpen(true)
    } else {
      props.onClick?.()
    }
  }

  const handleSubmit = () => {
    setConfirmOpen(false)
    props.onClick?.()
  }

  return (
    <>
      <IconButton
        appearance="link"
        className={`${props.className} ${className()}`}
        icon={props.icon}
        onClick={handleClick}
        disabled={props.disabled}
        title={props.title}
      />
      <Modal backdrop="static" role="alertdialog" open={confirmOpen} onClose={() => setConfirmOpen(false)} size="xs">
        <Modal.Body>{props.confirmText}</Modal.Body>
        <Modal.Footer>
          <Button appearance="primary" type="submit" onClick={handleSubmit}>
            <FormattedMessage id="timeline.actions.confirm_reblog.reblog" />
          </Button>
          <Button onClick={() => setConfirmOpen(false)}>
            <FormattedMessage id="timeline.actions.confirm_reblog.cancel" />
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  )
}

export default ActionButton
