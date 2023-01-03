import { invoke } from '@tauri-apps/api/tauri'
import { ReactElement } from 'react'
import { Icon } from '@rsuite/icons'
import { Popover, Dropdown, Sidebar, Sidenav, Whisper, Button, Avatar, Badge } from 'rsuite'
import { BsPlus, BsGear, BsPencilSquare } from 'react-icons/bs'
import { Server } from 'src/entities/server'
import FailoverImg from 'src/utils/failoverImg'
import { Unread } from 'src/entities/unread'

type NavigatorProps = {
  servers: Array<Server>
  unreads: Array<Unread>
  addNewServer: () => void
  openAuthorize: (server: Server) => void
  toggleCompose: () => void
  openThirdparty: () => void
  openSettings: () => void
}

const Navigator: React.FC<NavigatorProps> = (props): ReactElement => {
  const { servers, openAuthorize, openThirdparty, openSettings } = props

  return (
    <Sidebar
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: 'var(--rs-sidenav-default-bg)' }}
      width="56"
      collapsible
    >
      <Sidenav expanded={false}>
        <Sidenav.Body style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Button appearance="link" size="lg" onClick={props.toggleCompose}>
            <Icon as={BsPencilSquare} style={{ fontSize: '1.4em' }} />
          </Button>
        </Sidenav.Body>
      </Sidenav>
      <Sidenav expanded={false}>
        <Sidenav.Body style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Button appearance="link" size="lg" onClick={props.addNewServer}>
            <Icon as={BsPlus} style={{ fontSize: '1.4em' }} />
          </Button>
          {servers.map(server => (
            <div key={server.id}>
              <Whisper
                placement="right"
                controlId="control-id-context-menu"
                trigger="contextMenu"
                speaker={({ className, left, top, onClose }, ref) =>
                  serverMenu({ className, left, top, onClose, server, openAuthorize }, ref)
                }
              >
                <Button appearance="link" size="xs" style={{ padding: '8px' }}>
                  <Badge content={props.unreads.find(u => u.server_id === server.id && u.count > 0) ? true : false}>
                    <Avatar size="sm" src={FailoverImg(server.favicon)} className="server-icon" alt={server.domain} key={server.id} />
                  </Badge>
                </Button>
              </Whisper>
            </div>
          ))}
          <Whisper
            placement="rightEnd"
            controlId="control-id-settings-menu"
            trigger="click"
            speaker={({ className, left, top, onClose }, ref) =>
              settingsMenu({ className, left, top, onClose, openThirdparty, openSettings }, ref)
            }
          >
            <Button appearance="link" size="lg">
              <Icon as={BsGear} style={{ fontSize: '1.4em' }} />
            </Button>
          </Whisper>
        </Sidenav.Body>
      </Sidenav>
    </Sidebar>
  )
}

type ServerMenuProps = {
  className: string
  left?: number
  top?: number
  onClose: (delay?: number) => NodeJS.Timeout | void
  server: Server
  openAuthorize: (server: Server) => void
}

const serverMenu = (
  { className, left, top, onClose, server, openAuthorize }: ServerMenuProps,
  ref: React.RefCallback<HTMLElement>
): ReactElement => {
  const handleSelect = (eventKey: string) => {
    onClose()
    switch (eventKey) {
      case '0':
        openAuthorize(server)
        break
      case '1':
        invoke('remove_server', { id: server.id })
        break
    }
  }
  return (
    <Popover ref={ref} className={className} style={{ left, top, padding: 0 }}>
      <Dropdown.Menu onSelect={handleSelect}>
        {server.account_id === null && <Dropdown.Item eventKey="0">Authorize</Dropdown.Item>}
        <Dropdown.Item eventKey="1">Remove</Dropdown.Item>
      </Dropdown.Menu>
    </Popover>
  )
}

type SettingsMenuProps = {
  className: string
  left?: number
  top?: number
  onClose: (delay?: number) => NodeJS.Timeout | void
  openThirdparty: () => void
  openSettings: () => void
}

const settingsMenu = (
  { className, left, top, onClose, openThirdparty, openSettings }: SettingsMenuProps,
  ref: React.RefCallback<HTMLElement>
): ReactElement => {
  const handleSelect = (eventKey: string) => {
    onClose()
    switch (eventKey) {
      case 'settings': {
        openSettings()
        break
      }
      case 'thirdparty': {
        openThirdparty()
        break
      }
    }
  }

  return (
    <Popover ref={ref} className={className} style={{ left, top, padding: 0 }}>
      <Dropdown.Menu onSelect={handleSelect}>
        <Dropdown.Item eventKey="settings">Settings</Dropdown.Item>
        <Dropdown.Item eventKey="thirdparty">Third-party licenses</Dropdown.Item>
      </Dropdown.Menu>
    </Popover>
  )
}

export default Navigator
