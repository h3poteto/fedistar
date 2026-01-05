import { Entity, MegalodonInterface } from 'megalodon'
import Image from 'next/image'
import { forwardRef, useEffect, useRef, useState } from 'react'
import { FormattedMessage } from 'react-intl'
import { Button, ButtonToolbar, FlexboxGrid, Form, Input, Modal, Schema } from 'rsuite'

type Props = {
  attachment: Entity.Attachment | null
  client: MegalodonInterface
  opened: boolean
  close: () => void
}

type FormValue = {
  description: string
}

const model = Schema.Model({
  description: Schema.Types.StringType().isRequired('This field is required').maxLength(1500)
})

export default function EditMedia(props: Props) {
  const [formValue, setFormValue] = useState<FormValue>({
    description: ''
  })
  const [loading, setLoading] = useState(false)
  const [attachment, setAttachment] = useState<Entity.Attachment | null>(null)

  const formRef = useRef<any>(null)

  useEffect(() => {
    if (!props.attachment) {
      setAttachment(null)
      return
    }
    const f = async () => {
      const res = await props.client.getMedia(props.attachment.id)
      setAttachment(res.data)
      if (res.data.description) {
        setFormValue({
          description: res.data.description
        })
      } else {
        setFormValue({
          description: ''
        })
      }
    }
    f()
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
      await props.client.updateMedia(attachment.id, { description: formValue.description })
    } finally {
      setLoading(false)
    }
  }

  return (
    <Modal open={props.opened} onClose={() => props.close()} size="md">
      <Modal.Header>
        <FormattedMessage id="compose.edit_attachment.title" />
      </Modal.Header>
      <Modal.Body>
        <FlexboxGrid>
          <FlexboxGrid.Item colspan={8}>
            <Form fluid model={model} onChange={setFormValue} formValue={formValue} ref={formRef}>
              <Form.Group controlId="description">
                <Form.ControlLabel>
                  <FormattedMessage id="compose.edit_attachment.label" />
                </Form.ControlLabel>
                {/** @ts-ignore **/}
                <Form.Control name="description" rows={5} accepter={Textarea} />
              </Form.Group>
              <Form.Group>
                <ButtonToolbar style={{ justifyContent: 'flex-end' }}>
                  <Button appearance="primary" type="submit" loading={loading} onClick={handleSubmit}>
                    <FormattedMessage id="compose.edit_attachment.submit" />
                  </Button>
                </ButtonToolbar>
              </Form.Group>
            </Form>
          </FlexboxGrid.Item>
          <FlexboxGrid.Item colspan={16}>
            <div style={{ height: '320px', width: '320px' }}>
              {attachment && <Image src={attachment.preview_url} fill alt="" style={{ objectFit: 'contain' }} />}
            </div>
          </FlexboxGrid.Item>
        </FlexboxGrid>
      </Modal.Body>
    </Modal>
  )
}

const Textarea = forwardRef<HTMLTextAreaElement>((props, ref) => <Input {...props} as="textarea" ref={ref} />)
