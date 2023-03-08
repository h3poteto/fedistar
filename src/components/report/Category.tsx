import { Entity } from 'megalodon'
import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Modal, Radio, Button, RadioGroup } from 'rsuite'

type Props = {
  next: (category: Entity.Category) => void
}

export default function Category(props: Props) {
  const { t } = useTranslation()
  const [value, setValue] = useState<Entity.Category>()

  return (
    <>
      <Modal.Body>
        <Modal.Title>{t('report.category.title')}</Modal.Title>
        <p>{t('report.category.description')}</p>
        <div style={{ paddingTop: '2em' }}>
          <RadioGroup name="category" value={value} onChange={v => setValue(v as Entity.Category)}>
            <Radio value="spam">{t('report.category.spam')}</Radio>
            <Radio value="violation">{t('report.category.violation')}</Radio>
            <Radio value="other">{t('report.category.other')}</Radio>
          </RadioGroup>
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button appearance="primary" block onClick={() => props.next(value)}>
          {t('report.category.next')}
        </Button>
      </Modal.Footer>
    </>
  )
}
