import { invoke } from '@tauri-apps/api/tauri'
import { ReactElement, SetStateAction } from 'react'
import { Icon } from '@rsuite/icons'
import { Popover, Dropdown, Sidebar, Sidenav, Whisper, Button, Avatar, Badge } from 'rsuite'
import { BsPlus, BsGear, BsPencilSquare } from 'react-icons/bs'
import { Server } from 'src/entities/server'
import FailoverImg from 'src/utils/failoverImg'

type NavigatorProps = {
  servers: Array<Server>
  unreads: Map<number, number>
  setNewServer: (value: SetStateAction<boolean>) => void
  setInitialServer: (value: SetStateAction<Server>) => void
}

type ServerMenuProps = {
  className: string
  left?: number
  top?: number
  onClose: (delay?: number) => NodeJS.Timeout | void
  server: Server
  setNewServer: (value: SetStateAction<boolean>) => void
  setInitialServer: (value: SetStateAction<Server>) => void
}

const serverMenu = (
  { className, left, top, onClose, server, setNewServer, setInitialServer }: ServerMenuProps,
  ref: React.RefCallback<HTMLElement>
): ReactElement => {
  const handleSelect = (eventKey: string) => {
    onClose()
    switch (eventKey) {
      case '0':
        setNewServer(true)
        setInitialServer(server)
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

const Navigator: React.FC<NavigatorProps> = (props): ReactElement => {
  const { servers, setNewServer, setInitialServer, unreads } = props

  return (
    <Sidebar
      style={{ display: 'flex', flexDirection: 'column', justifyContent: 'space-between', backgroundColor: 'var(--rs-sidenav-default-bg)' }}
      width="56"
      collapsible
    >
      <Sidenav expanded={false}>
        <Sidenav.Body style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Button appearance="link" size="lg">
            <Icon as={BsPencilSquare} style={{ fontSize: '1.4em' }} />
          </Button>
        </Sidenav.Body>
      </Sidenav>
      <Sidenav expanded={false}>
        <Sidenav.Body style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <Button appearance="link" size="lg" onClick={() => setNewServer(true)}>
            <Icon as={BsPlus} style={{ fontSize: '1.4em' }} />
          </Button>
          {servers.map(server => (
            <div key={server.id}>
              <Whisper
                placement="right"
                controlId="control-id-context-menu"
                trigger="contextMenu"
                speaker={({ className, left, top, onClose }, ref) =>
                  serverMenu({ className, left, top, onClose, server, setNewServer, setInitialServer }, ref)
                }
              >
                <Button appearance="link" size="xs" style={{ padding: '4px 8px' }}>
                  <Badge content={unreads.get(server.id) ? true : false}>
                    <Avatar size="sm" src={FailoverImg(server.favicon)} className="server-icon" alt={server.domain} key={server.id} />
                  </Badge>
                </Button>
              </Whisper>
            </div>
          ))}
          <Button appearance="link" size="lg" disabled>
            <Icon as={BsGear} style={{ fontSize: '1.4em' }} />
          </Button>
        </Sidenav.Body>
      </Sidenav>
    </Sidebar>
  )
}

export default Navigator
