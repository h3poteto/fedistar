import { Entity, MegalodonInterface } from 'megalodon'
import Image from 'next/image'
import { forwardRef, useEffect, useRef, useState } from 'react'
import { Button, ButtonToolbar, FlexboxGrid, Form, Input, Modal, Schema } from 'rsuite'
import { TFunction } from 'i18next'

type Props = {
  attachment: Entity.Attachment | null
  client: MegalodonInterface
  opened: boolean
  close: () => void
  t: TFunction<'translation', undefined, 'translation'>
}

type FormValue = {
  description: string
}

const model = Schema.Model({
  description: Schema.Types.StringType().isRequired('This field is required').maxLength(1500)
})

export default function EditMedia(props: Props) {
  const { t } = props

  const [formValue, setFormValue] = useState<FormValue>({
    description: ''
  })
  const [loading, setLoading] = useState(false)

  const formRef = useRef<any>()

  useEffect(() => {
    if (!props.attachment) {
      return
    }
    setFormValue({
      description: props.attachment.description
    })
  }, [props.attachment, props.client])

  const handleSubmit = async () => {
    if (loading) return
    if (formRef === undefined || formRef.current === undefined) {
      return
    } else if (!formRef.current.check()) {
      return
    }
    setLoading(true)
    try {
      await props.client.updateMedia(props.attachment.id, { description: formValue.description })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={props.opened} onClose={() => props.close()} size="md">
      <Modal.Header>{t('compose.edit_attachment.title')}</Modal.Header>
      <Modal.Body>
        <FlexboxGrid>
          <FlexboxGrid.Item colspan={8}>
            <Form fluid model={model} onChange={setFormValue} formValue={formValue} ref={formRef}>
              <Form.Group controlId="description">
                <Form.ControlLabel>{t('compose.edit_attachment.label')}</Form.ControlLabel>
                {/** @ts-ignore **/}
                <Form.Control name="description" rows={5} accepter={Textarea} />
              </Form.Group>
              <Form.Group>
                <ButtonToolbar style={{ justifyContent: 'flex-end' }}>
                  <Button appearance="primary" type="submit" loading={loading} onClick={handleSubmit}>
                    {t('compose.edit_attachment.submit')}
                  </Button>
                </ButtonToolbar>
              </Form.Group>
            </Form>
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={16}>
            <div style={{ height: '320px', width: '320px' }}>
              {props.attachment && <Image src={props.attachment.url} fill alt="" style={{ objectFit: 'contain' }} />}
            </div>
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </Modal.Body>
    </Modal>
  )
}

const Textarea = forwardRef<HTMLTextAreaElement>((props, ref) => <Input {...props} as="textarea" ref={ref} />)
