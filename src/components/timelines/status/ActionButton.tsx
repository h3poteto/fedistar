import { ReactElement } from 'react'
import { IconButton } from 'rsuite'

type Props = {
  icon: ReactElement
  onClick?: () => void
  disabled?: boolean
  className?: string
  activating?: boolean
  deactivating?: boolean
}

const ActionButton: React.FC<Props> = props => {
  const className = () => {
    if (props.activating) {
      return 'activating'
    } else if (props.deactivating) {
      return 'deactivating'
    } else {
      return ''
    }
  }
  return (
    <IconButton
      appearance="link"
      className={`${props.className} ${className()}`}
      icon={props.icon}
      onClick={props.onClick}
      disabled={props.disabled}
    />
  )
}

export default ActionButton
