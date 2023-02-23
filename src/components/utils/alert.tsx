import { Message } from 'rsuite'

function alert(type: 'info' | 'success' | 'warning' | 'error', message: string) {
  return (
    <Message showIcon type={type}>
      {message}
    </Message>
  )
}

export default alert
