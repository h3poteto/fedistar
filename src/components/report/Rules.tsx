import { Entity, MegalodonInterface } from 'megalodon'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button, Checkbox, CheckboxGroup, Modal } from 'rsuite'

type Props = {
  client: MegalodonInterface
  next: (rules: Array<string>) => void
}

export default function Rules(props: Props) {
  const { t } = useTranslation()
  const [rules, setRules] = useState<Array<Entity.InstanceRule>>([])
  const [values, setValues] = useState<Array<string>>([])

  useEffect(() => {
    const f = async () => {
      const res = await props.client.getInstance()
      if (res.data.rules) {
        setRules(res.data.rules)
      }
    }
    f()
  }, [props.client])

  return (
    <>
      <Modal.Title>{t('report.rules.title')}</Modal.Title>
      <p>{t('report.rules.description')}</p>
      <div style={{ paddingTop: '2em' }}>
        <CheckboxGroup name="rules" value={values} onChange={value => setValues(value.map(v => v.toString()))}>
          {rules.length === 0 && <p>{t('report.rules.no_rules')}</p>}
          {rules.map(r => (
            <Checkbox key={r.id} value={r.id}>
              {r.text}
            </Checkbox>
          ))}
        </CheckboxGroup>
      </div>
      <hr />
      <Button appearance="primary" onClick={() => props.next(values)}>
        {t('report.rules.next')}
      </Button>
    </>
  )
}
