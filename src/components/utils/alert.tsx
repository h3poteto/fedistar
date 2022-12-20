import { Message } from 'rsuite'

const alert = (type: 'info' | 'success' | 'warning' | 'error', message: string) => (
  <Message showIcon type={type} duration={5000}>
    {message}
  </Message>
)

export default alert
