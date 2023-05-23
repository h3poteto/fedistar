import { Entity } from 'megalodon'
import { useState } from 'react'
import { TFunction } from 'i18next'
import { Modal, Radio, Button, RadioGroup } from 'rsuite'

type Props = {
  next: (category: Entity.Category) => void
  t: TFunction<'translation', undefined, 'translation'>
}

export default function Category(props: Props) {
  const { t } = props
  const [value, setValue] = useState<Entity.Category | null>(null)

  return (
    <>
      <Modal.Body>
        <Modal.Title>{t('report.category.title')}</Modal.Title>
        <p>{t('report.category.description')}</p>
        <div style={{ paddingTop: '2em' }}>
          <RadioGroup name="category" value={value} onChange={v => setValue(v as Entity.Category)}>
            <Radio defaultChecked={false} value="spam">
              {t('report.category.spam')}
            </Radio>
            <Radio defaultChecked={false} value="violation">
              {t('report.category.violation')}
            </Radio>
            <Radio defaultChecked={false} value="other">
              {t('report.category.other')}
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
          {t('report.category.next')}
        </Button>
      </Modal.Footer>
    </>
  )
}
