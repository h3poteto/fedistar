import { invoke } from '@tauri-apps/api/tauri'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { InputNumber, Modal, Panel, Form, Schema, ButtonToolbar, Button, InputPicker } from 'rsuite'
import { Settings } from 'src/entities/settings'
import { localeType } from 'src/i18n'

type Props = {
  open: boolean
  onClose: () => void
  reloadAppearance: () => void
}

type FormValue = {
  font_size: number
  language: localeType
}

const languages = [
  {
    label: 'English',
    value: 'en'
  },
  {
    label: '日本語',
    value: 'ja'
  },
  {
    label: 'Italian',
    value: 'it'
  }
]

const Settings: React.FC<Props> = props => {
  const { t } = useTranslation()

  const [formValue, setFormValue] = useState<FormValue>({
    font_size: 14,
    language: 'en'
  })

  const model = Schema.Model<FormValue>({
    font_size: Schema.Types.NumberType(t('settings.settings.validation.font_size.type'))
      .range(1, 30, t('settings.settings.validation.font_size.range', { from: 1, to: 30 }))
      .isRequired(t('settings.settings.validation.font_size.required')),
    language: Schema.Types.StringType().isRequired(t('settings.settings.validation.language.required'))
  })

  useEffect(() => {
    const f = async () => {
      const settings = await invoke<Settings>('read_settings')
      setFormValue(current => Object.assign({}, current, settings.appearance))
    }
    f()
  }, [])

  const handleSubmit = async () => {
    const settings: Settings = {
      appearance: {
        font_size: Number(formValue.font_size),
        language: formValue.language
      }
    }
    await invoke('save_settings', { obj: settings })
    props.reloadAppearance()
  }

  return (
    <Modal backdrop="static" keyboard={true} open={props.open} onClose={props.onClose}>
      <Modal.Header>
        <Modal.Title>{t('settings.settings.title')}</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form layout="horizontal" formValue={formValue} onChange={setFormValue} model={model}>
          <Panel header={t('settings.settings.appearance.title')}>
            <Form.Group controlId="language">
              <Form.ControlLabel>{t('settings.settings.appearance.language')}</Form.ControlLabel>
              <Form.Control name="language" accepter={InputPicker} cleanable={false} data={languages} />
            </Form.Group>
            <Form.Group controlId="font_size">
              <Form.ControlLabel>{t('settings.settings.appearance.font_size')}</Form.ControlLabel>
              <Form.Control name="font_size" accepter={InputNumber} postfix="px" />
            </Form.Group>
          </Panel>
          <Form.Group>
            <ButtonToolbar style={{ justifyContent: 'flex-end' }}>
              <Button appearance="primary" type="submit" onClick={handleSubmit}>
                {t('settings.settings.save')}
              </Button>
              <Button onClick={props.onClose}>{t('settings.settings.close')}</Button>
            </ButtonToolbar>
          </Form.Group>
        </Form>
      </Modal.Body>
    </Modal>
  )
}

export default Settings
