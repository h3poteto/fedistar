import { Modal, Form, ButtonToolbar, Button, Input, Loader, useToaster } from 'rsuite'
import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { Server } from 'src/entities/server'
import { OAuth } from 'megalodon'
import alert from '../utils/alert'

type Props = {
  open: boolean
  onClose: () => void
  initialServer: Server | null
}

const New: React.FC<Props> = props => {
  const [server, setServer] = useState<Server>()
  const [app, setApp] = useState<OAuth.AppDataFromServer>()
  const [loading, setLoading] = useState<boolean>(false)
  const [domain, setDomain] = useState('')
  const [code, setCode] = useState('')

  const toast = useToaster()

  useEffect(() => {
    if (props.initialServer) {
      setServer(props.initialServer)
      setDomain(props.initialServer.domain)
    }
  }, [props.initialServer])

  async function addServer() {
    setLoading(true)
    try {
      const res = await invoke<Server>('add_server', { domain })
      setServer(res)
    } catch (err) {
      console.error(err)
      toast.push(alert('error', 'Failed to add server'), { placement: 'topCenter' })
    } finally {
      setLoading(false)
    }
  }

  async function addApplication() {
    setLoading(true)
    try {
      const res = await invoke<OAuth.AppDataFromServer>('add_application', { url: server.base_url })
      setApp(res)
    } catch (err) {
      console.error(err)
      toast.push(alert('error', 'Failed to add application'), { placement: 'topCenter' })
    } finally {
      setLoading(false)
    }
  }

  async function authorizeCode() {
    setLoading(true)
    try {
      await invoke('authorize_code', { server: server, app: app, code: code })
      clear()
      props.onClose()
    } catch (err) {
      console.error(err)
      toast.push(alert('error', 'Failed to authorize'), { placement: 'topCenter' })
    } finally {
      setLoading(false)
    }
  }

  const clear = () => {
    setServer(undefined)
    setApp(undefined)
    setLoading(false)
    setDomain('')
    setCode('')
  }

  const close = () => {
    clear()
    props.onClose()
  }

  return (
    <Modal backdrop="static" keyboard={true} open={props.open} onClose={() => close()}>
      <Modal.Header>
        <Modal.Title>Add Server</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {server === undefined && (
          <Form fluid onChange={o => setDomain(o.domain)}>
            <Form.Group>
              <Form.ControlLabel>Domain</Form.ControlLabel>
              <Form.Control name="domain" />
            </Form.Group>
            <Form.Group>
              <ButtonToolbar>
                <Button appearance="primary" onClick={() => addServer()}>
                  Add
                </Button>
                <Button appearance="link" onClick={() => close()}>
                  Cancel
                </Button>
              </ButtonToolbar>
            </Form.Group>
          </Form>
        )}
        {server !== undefined && app === undefined && (
          <Form fluid>
            <Form.Group>
              <p>You can also quit without signing in. If that case, you can see only Federated and Local timelines.</p>
            </Form.Group>
            <Form.Group>
              <Input value={domain} readOnly />
            </Form.Group>
            <Form.Group>
              <ButtonToolbar>
                <Button appearance="primary" onClick={() => addApplication()}>
                  Sign In
                </Button>
                <Button appearance="link" onClick={() => close()}>
                  Finish
                </Button>
              </ButtonToolbar>
            </Form.Group>
          </Form>
        )}
        {app !== undefined && (
          <Form fluid onChange={o => setCode(o.code)}>
            <Form.Group>
              <Form.ControlLabel>Authorization Code</Form.ControlLabel>
              <Form.Control name="code" />
              <Form.HelpText>Please paste the authorization code from your browser</Form.HelpText>
            </Form.Group>
            <Form.Group>
              <ButtonToolbar>
                <Button appearance="primary" onClick={() => authorizeCode()}>
                  Authorize
                </Button>
                <Button appearance="link" onClick={() => close()}>
                  Cancel
                </Button>
              </ButtonToolbar>
            </Form.Group>
          </Form>
        )}
        {loading && <Loader center backdrop content="loading" />}
      </Modal.Body>
    </Modal>
  )
}

export default New
