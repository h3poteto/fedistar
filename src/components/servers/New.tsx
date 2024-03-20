import { Modal, Form, ButtonToolbar, Button, Input, Loader, useToaster } from 'rsuite'
import { useEffect, useState } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { Server } from 'src/entities/server'
import { OAuth } from 'megalodon'
import alert from '../utils/alert'
import { parseDomain } from 'src/utils/domainParser'
import { FormattedMessage, useIntl } from 'react-intl'

type Props = {
  open: boolean
  onClose: () => void
  initialServer: Server | null
}

const New: React.FC<Props> = props => {
  const { formatMessage } = useIntl()

  const [server, setServer] = useState<Server>()
  const [app, setApp] = useState<OAuth.AppData>()
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
      const d = parseDomain(domain)
      const res = await invoke<Server>('add_server', { domain: d })
      setServer(res)
    } catch (err) {
      console.error(err)
      toast.push(alert('error', formatMessage({ id: 'alert.failed_add_server' }, { domain: domain })), { placement: 'topCenter' })
    } finally {
      setLoading(false)
    }
  }

  async function addApplication() {
    setLoading(true)
    try {
      const res = await invoke<OAuth.AppData>('add_application', { url: server.base_url })
      setApp(res)
    } catch (err) {
      console.error(err)
      toast.push(alert('error', formatMessage({ id: 'alert.failed_add_application' })), { placement: 'topCenter' })
    } finally {
      setLoading(false)
    }
  }

  async function authorizeCode() {
    setLoading(true)
    try {
      await invoke('authorize_code', { server: server, app: app, code: code })
      finish()
    } catch (err) {
      console.error(err)
      toast.push(alert('error', formatMessage({ id: 'alert.failed_authorize' })), { placement: 'topCenter' })
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

  const finish = async () => {
    close()
    await invoke('init_instruction')
  }

  const close = () => {
    clear()
    props.onClose()
  }

  return (
    <Modal backdrop="static" keyboard={true} open={props.open} onClose={() => close()}>
      <Modal.Header>
        <Modal.Title>
          <FormattedMessage id="servers.new.title" />
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {server === undefined && (
          <Form fluid formValue={{ domain: domain }} onChange={o => setDomain(o.domain)}>
            <Form.Group>
              <Form.ControlLabel>
                <FormattedMessage id="servers.new.domain" />
              </Form.ControlLabel>
              <Form.Control name="domain" placeholder="mastodon.social" />
            </Form.Group>
            <Form.Group>
              <ButtonToolbar>
                <Button appearance="primary" onClick={() => addServer()}>
                  <FormattedMessage id="servers.new.add" />
                </Button>
                <Button appearance="link" onClick={() => close()}>
                  <FormattedMessage id="servers.new.cancel" />
                </Button>
              </ButtonToolbar>
            </Form.Group>
          </Form>
        )}
        {server !== undefined && app === undefined && (
          <Form fluid>
            <Form.Group>
              <p>
                <FormattedMessage id="servers.new.server_description" />
              </p>
            </Form.Group>
            <Form.Group>
              <Input value={domain} readOnly />
            </Form.Group>
            <Form.Group>
              <ButtonToolbar>
                <Button appearance="primary" onClick={() => addApplication()}>
                  <FormattedMessage id="servers.new.sign_in" />
                </Button>
                <Button appearance="link" onClick={() => finish()}>
                  <FormattedMessage id="servers.new.finish" />
                </Button>
              </ButtonToolbar>
            </Form.Group>
          </Form>
        )}
        {app !== undefined && (
          <Form fluid formValue={{ code: code }} onChange={o => setCode(o.code)}>
            {app.session_token ? (
              <div style={{ margin: '1em 0' }}>
                <FormattedMessage id="servers.new.without_code_authorize" />
              </div>
            ) : (
              <Form.Group>
                <Form.ControlLabel>
                  <FormattedMessage id="servers.new.authorization_code" />
                </Form.ControlLabel>
                <Form.Control name="code" />
                <Form.HelpText>
                  <FormattedMessage id="servers.new.authorization_help" />
                </Form.HelpText>
              </Form.Group>
            )}
            <Form.Group>
              <ButtonToolbar>
                <Button appearance="primary" onClick={() => authorizeCode()}>
                  <FormattedMessage id="servers.new.authorize" />
                </Button>
                <Button appearance="link" onClick={() => finish()}>
                  <FormattedMessage id="servers.new.cancel" />
                </Button>
              </ButtonToolbar>
            </Form.Group>
          </Form>
        )}
        {loading && <Loader center backdrop content={<FormattedMessage id="servers.new.loading" />} />}
      </Modal.Body>
    </Modal>
  )
}

export default New
