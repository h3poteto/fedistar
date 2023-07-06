import { Entity } from 'megalodon'
import { useState } from 'react'
import { FormattedMessage } from 'react-intl'
import { Modal, Radio, Button, RadioGroup } from 'rsuite'

type Props = {
  next: (category: Entity.Category) => void
}

export default function Category(props: Props) {
  const [value, setValue] = useState<Entity.Category | null>(null)

  return (
    <>
      <Modal.Body>
        <Modal.Title>
          <FormattedMessage id="report.category.title" />
        </Modal.Title>
        <p>
          <FormattedMessage id="report.category.description" />
        </p>
        <div style={{ paddingTop: '2em' }}>
          <RadioGroup name="category" value={value} onChange={v => setValue(v as Entity.Category)}>
            <Radio defaultChecked={false} value="spam">
              <FormattedMessage id="report.category.spam" />
            </Radio>
            <Radio defaultChecked={false} value="violation">
              <FormattedMessage id="report.category.violation" />
            </Radio>
            <Radio defaultChecked={false} value="other">
              <FormattedMessage id="report.category.other" />
            </Radio>
          </RadioGroup>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button
          appearance="primary"
          block
          onClick={() => {
            if (value) props.next(value)
          }}
        >
          <FormattedMessage id="report.category.next" />
        </Button>
      </Modal.Footer>
    </>
  )
}
