import { invoke } from '@tauri-apps/api/core'
import { ChangeEvent, SyntheticEvent, useEffect, useState } from 'react'
import { FormattedMessage, useIntl } from 'react-intl'
import { InputNumber, Modal, Panel, Form, Schema, ButtonToolbar, Button, InputPicker, Checkbox } from 'rsuite'
import { Settings as SettingsType, ThemeType } from 'src/entities/settings'
import { localeType } from 'src/i18n'

type Props = {
  open: boolean
  onClose: () => void
  reloadAppearance: () => void
  reloadBehavior: () => void
}

type FormValue = {
  font_size: number
  font_family: string | null
  language: localeType
  color_theme: ThemeType
  confirm_reblog: boolean
}

const languages = [
  {
    label: 'Bahasa Indonesia',
    value: 'id'
  },
  {
    label: 'Deutsch',
    value: 'de'
  },
  {
    label: 'English',
    value: 'en'
  },
  {
    label: 'Español',
    value: 'es-ES'
  },
  {
    label: 'français',
    value: 'fr'
  },
  {
    label: 'Interlingua',
    value: 'ia'
  },
  {
    label: 'italiano',
    value: 'it'
  },
  {
    label: 'Polski',
    value: 'pl'
  },
  {
    label: 'português brasileiro',
    value: 'pt-BR'
  },

  {
    label: '日本語',
    value: 'ja'
  },
  {
    label: '简体字',
    value: 'zh-CN'
  },
  {
    label: '한국어',
    value: 'ko'
  }
]

const themes = [
  {
    key: 'settings.settings.appearance.theme.light',
    value: 'light'
  },
  {
    key: 'settings.settings.appearance.theme.dark',
    value: 'dark'
  },
  {
    key: 'settings.settings.appearance.theme.high_contrast',
    value: 'high-contrast'
  }
]

export default function Settings(props: Props) {
  const { formatMessage } = useIntl()
  const [formValue, setFormValue] = useState<FormValue>({
    font_size: 14,
    font_family: null,
    language: 'en',
    color_theme: 'dark',
    confirm_reblog: false
  })
  const [fontList, setFontList] = useState<Array<{ label: string; value: string }>>([])
  const [settings, setSettings] = useState<SettingsType>()

  const model = Schema.Model<FormValue>({
    font_size: Schema.Types.NumberType(formatMessage({ id: 'settings.settings.validation.font_size.type' }))
      .range(1, 30, formatMessage({ id: 'settings.settings.validation.font_size.range' }, { from: 1, to: 30 }))
      .isRequired(formatMessage({ id: 'settings.settings.validation.font_size.required' })),
    font_family: Schema.Types.StringType(),
    language: Schema.Types.StringType().isRequired(formatMessage({ id: 'settings.settings.validation.language.required' })),
    color_theme: Schema.Types.StringType(),
    confirm_reblog: Schema.Types.BooleanType()
  })

  useEffect(() => {
    const f = async () => {
      const settings = await invoke<SettingsType>('read_settings')
      setFormValue(current => Object.assign({}, current, settings.appearance, settings.behavior))
      setSettings(settings)
      const f = await invoke<Array<string>>('list_fonts')
      setFontList(f.map(f => ({ label: f, value: f })))
    }
    f()
  }, [props.open])

  const handleSubmit = async () => {
    const s: SettingsType = {
      appearance: {
        font_size: Number(formValue.font_size),
        font_family: formValue.font_family,
        language: formValue.language,
        color_theme: formValue.color_theme
      },
      behavior: {
        confirm_reblog: formValue.confirm_reblog
      },
      app_menu: settings.app_menu
    }
    await invoke('save_settings', { obj: s })
    props.reloadAppearance()
    props.reloadBehavior()
  }

  const colorTheme = themes.map(theme => ({
    label: formatMessage({ id: theme.key }),
    value: theme.value
  }))

  const updateConfirmBoost = (_value: any, checked: boolean | SyntheticEvent<Element, Event>, _event?: ChangeEvent<HTMLInputElement>) => {
    if (typeof checked === 'boolean') {
      setFormValue(current => Object.assign({}, current, { confirm_reblog: checked }))
    }
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
            <Form.Group controlId="font_family">
              <Form.ControlLabel>
                <FormattedMessage id="settings.settings.appearance.font_family" />
              </Form.ControlLabel>
              <Form.Control name="font_family" accepter={InputPicker} cleanable={true} data={fontList} />
            </Form.Group>
            <Form.Group controlId="color_theme">
              <Form.ControlLabel>
                <FormattedMessage id="settings.settings.appearance.color_theme" />
              </Form.ControlLabel>
              <Form.Control name="color_theme" accepter={InputPicker} cleanable={false} data={colorTheme} />
            </Form.Group>
          </Panel>
          <Panel header={<FormattedMessage id="settings.settings.behavior.title" />}>
            <Form.Group controlId="confirm_reblog">
              <Form.ControlLabel>
                <FormattedMessage id="settings.settings.behavior.confirm_reblog" />
              </Form.ControlLabel>
              <Form.Control
                name="confirm_reblog"
                accepter={Checkbox}
                defaultChecked={formValue.confirm_reblog}
                onChange={updateConfirmBoost}
              />
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
