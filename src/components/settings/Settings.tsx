import { invoke } from '@tauri-apps/api/tauri'
import { useEffect, useState } from 'react'
import { InputNumber, Modal, Panel, Form, Schema, ButtonToolbar, Button } from 'rsuite'
import { Settings } from 'src/entities/settings'

type Props = {
  open: boolean
  onClose: () => void
  reloadAppearance: () => void
}

type FormValue = {
  font_size: number
}

const Settings: React.FC<Props> = props => {
  const [formValue, setFormValue] = useState<FormValue>({
    font_size: 14
  })

  const model = Schema.Model<FormValue>({
    font_size: Schema.Types.NumberType('Please enter a valid number')
      .range(1, 30, 'Please enter a number from 1 to 30')
      .isRequired('Font size is required')
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
        font_size: Number(formValue.font_size)
      }
    }
    await invoke('save_settings', { obj: settings })
    props.reloadAppearance()
  }

  return (
    <Modal backdrop="static" keyboard={true} open={props.open} onClose={props.onClose}>
      <Modal.Header>
        <Modal.Title>Settings</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <Form layout="horizontal" formValue={formValue} onChange={setFormValue} model={model}>
          <Panel header="Appearance">
            <Form.Group controlId="font_size">
              <Form.ControlLabel>Font size</Form.ControlLabel>
              <Form.Control name="font_size" accepter={InputNumber} postfix="px" />
            </Form.Group>
          </Panel>
          <Form.Group>
            <ButtonToolbar style={{ justifyContent: 'flex-end' }}>
              <Button appearance="primary" type="submit" onClick={handleSubmit}>
                Save
              </Button>
              <Button onClick={props.onClose}>Close</Button>
            </ButtonToolbar>
          </Form.Group>
        </Form>
      </Modal.Body>
    </Modal>
  )
}

export default Settings
