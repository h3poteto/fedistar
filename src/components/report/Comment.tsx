import { useState } from 'react'
import { TFunction } from 'i18next'
import { Button, Input, Modal, Toggle } from 'rsuite'

type Props = {
  next: (comment: string, forward: boolean) => void
  t: TFunction<'translation', undefined, 'translation'>
}

export default function Comment(props: Props) {
  const { t } = props
  const [comment, setComment] = useState('')
  const [forward, setForward] = useState(true)

  return (
    <>
      <Modal.Body>
        <Modal.Title>{t('report.comment.title')}</Modal.Title>
        <div style={{ paddingTop: '2em' }}>
          <Input as="textarea" rows={3} value={comment} onChange={v => setComment(v)} placeholder={t('report.comment.placeholder')} />

          <div style={{ margin: '2em 0' }}>
            <Toggle checked={forward} onChange={value => setForward(value)} />
            <label style={{ marginLeft: '1em' }}>{t('report.comment.forward')}</label>
          </div>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button appearance="primary" block onClick={() => props.next(comment, forward)}>
          {t('report.comment.next')}
        </Button>
      </Modal.Footer>
    </>
  )
}
