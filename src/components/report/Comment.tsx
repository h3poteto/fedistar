import { useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { Button, Input, Modal, Toggle } from 'rsuite'

type Props = {
  next: (comment: string, forward: boolean) => void
}

export default function Comment(props: Props) {
  const { formatMessage } = useIntl()
  const [comment, setComment] = useState('')
  const [forward, setForward] = useState(true)

  return (
    <>
      <Modal.Body>
        <Modal.Title>
          <FormattedMessage id="report.comment.title" />
        </Modal.Title>
        <div style={{ paddingTop: '2em' }}>
          <Input
            as="textarea"
            rows={3}
            value={comment}
            onChange={v => setComment(v)}
            placeholder={formatMessage({ id: 'report.comment.placeholder' })}
          />

          <div style={{ margin: '2em 0' }}>
            <Toggle checked={forward} onChange={value => setForward(value)} />
            <label style={{ marginLeft: '1em' }}>
              <FormattedMessage id="report.comment.forward" />
            </label>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button appearance="primary" block onClick={() => props.next(comment, forward)}>
          <FormattedMessage id="report.comment.next" />
        </Button>
      </Modal.Footer>
    </>
  )
}
