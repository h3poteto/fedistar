import { invoke } from '@tauri-apps/api/tauri'
import { useEffect, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
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
  },
  {
    label: 'Brazilian Portuguese',
    value: 'pt-BR'
  },
  {
    label: 'French',
    value: 'fr'
  },
  {
    label: 'German',
    value: 'de'
  }
]

const Settings: React.FC<Props> = props => {
  const { formatMessage } = useIntl()
  const [formValue, setFormValue] = useState<FormValue>({
    font_size: 14,
    language: 'en'
  })

  const model = Schema.Model<FormValue>({
    font_size: Schema.Types.NumberType(formatMessage({ id: 'settings.settings.validation.font_size.type' }))
      .range(1, 30, formatMessage({ id: 'settings.settings.validation.font_size.range' }, { from: 1, to: 30 }))
      .isRequired(formatMessage({ id: 'settings.settings.validation.font_size.required' })),
    language: Schema.Types.StringType().isRequired(formatMessage({ id: 'settings.settings.validation.language.required' }))
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
        <Modal.Title>
          <FormattedMessage id="settings.settings.title" />
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form layout="horizontal" formValue={formValue} onChange={setFormValue} model={model}>
          <Panel header={<FormattedMessage id="settings.settings.appearance.title" />}>
            <Form.Group controlId="language">
              <Form.ControlLabel>
                <FormattedMessage id="settings.settings.appearance.language" />
              </Form.ControlLabel>
              <Form.Control name="language" accepter={InputPicker} cleanable={false} data={languages} />
            </Form.Group>
            <Form.Group controlId="font_size">
              <Form.ControlLabel>
                <FormattedMessage id="settings.settings.appearance.font_size" />
              </Form.ControlLabel>
              <Form.Control name="font_size" accepter={InputNumber} postfix="px" />
            </Form.Group>
          </Panel>
          <Form.Group>
            <ButtonToolbar style={{ justifyContent: 'flex-end' }}>
              <Button appearance="primary" type="submit" onClick={handleSubmit}>
                <FormattedMessage id="settings.settings.save" />
              </Button>
              <Button onClick={props.onClose}>
                <FormattedMessage id="settings.settings.close" />
              </Button>
            </ButtonToolbar>
          </Form.Group>
        </Form>
      </Modal.Body>
    </Modal>
  )
}

export default Settings
