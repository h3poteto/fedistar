import { invoke } from '@tauri-apps/api/tauri'
import { Dispatch, ReactElement, SetStateAction, useEffect, useState } from 'react'
import { Icon } from '@rsuite/icons'
import { Popover, Dropdown, Sidebar, Sidenav, Whisper, Button, Avatar, Badge, FlexboxGrid } from 'rsuite'
import { BsPlus, BsGear, BsPencilSquare } from 'react-icons/bs'
import { Server, ServerSet } from 'src/entities/server'
import { Timeline } from 'src/entities/timeline'
import FailoverImg from 'src/utils/failoverImg'
import { Unread } from 'src/entities/unread'
import { Instruction } from 'src/entities/instruction'
import { listen } from '@tauri-apps/api/event'
import { useTranslation } from 'react-i18next'

type NavigatorProps = {
  servers: Array<ServerSet>
  unreads: Array<Unread>
  addNewServer: () => void
  openAuthorize: (server: Server) => void
  toggleCompose: () => void
  openThirdparty: () => void
  openSettings: () => void
  setHighlighted: Dispatch<SetStateAction<Timeline>>
}

const Navigator: React.FC<NavigatorProps> = (props): ReactElement => {
  const { t } = useTranslation()
  const { servers, openAuthorize, openThirdparty, openSettings } = props
  const [walkthrough, setWalkthrough] = useState(false)

  useEffect(() => {
    const f = async () => {
      try {
        const instruction = await invoke<Instruction>('get_instruction')
        if (instruction.instruction == 2) {
          setWalkthrough(true)
        } else {
          setWalkthrough(false)
        }
      } catch (err) {
        console.log(err)
      }
    }
    f()
    listen<Instruction>('updated-instruction', event => {
      if (event.payload.instruction == 2) {
        setWalkthrough(true)
      } else {
        setWalkthrough(false)
      }
    })
  }, [])

  const closeWalkthrough = async () => {
    setWalkthrough(false)
    await invoke('update_instruction', { step: 3 })
  }

  const openNotification = async (set: ServerSet) => {
    if (!props.unreads.find(u => u.server_id === set.server.id && u.count > 0)) return
    const timelines = await invoke<Array<[Timeline, Server]>>('list_timelines')
    const target = timelines.find(t => t[1].id === set.server.id && t[0].kind === 'notifications')
    if (target === undefined || target === null) return
    props.setHighlighted(target[0])
    setTimeout(() => {
      props.setHighlighted(null)
    }, 10000)
    return
  }

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
          <Button appearance="link" size="lg" onClick={props.addNewServer} title={t('navigator.add_server.title')}>
            <Icon as={BsPlus} style={{ fontSize: '1.4em' }} />
          </Button>
          {walkthrough && (
            <div style={{ position: 'relative' }}>
              <Popover arrow={false} visible={walkthrough} style={{ left: 12, top: 'auto', bottom: 0 }}>
                <div style={{ width: '120px' }}>
                  <h4 style={{ fontSize: '1.2em' }}>{t('walkthrough.navigator.servers.title')}</h4>
                  <p>{t('walkthrough.navigator.servers.description')}</p>
                </div>
                <FlexboxGrid justify="end">
                  <Button appearance="default" size="xs" onClick={closeWalkthrough}>
                    {t('walkthrough.navigator.servers.ok')}
                  </Button>
                </FlexboxGrid>
              </Popover>
            </div>
          )}
          {servers.map(server => (
            <div key={server.server.id}>
              <Whisper
                placement="right"
                controlId="control-id-context-menu"
                trigger="contextMenu"
                onOpen={closeWalkthrough}
                speaker={({ className, left, top, onClose }, ref) =>
                  serverMenu({ className, left, top, onClose, server: server.server, openAuthorize }, ref)
                }
              >
                <Button
                  appearance="link"
                  size="xs"
                  style={{ padding: '8px' }}
                  title={server.account ? server.account.username + '@' + server.server.domain : server.server.domain}
                  onClick={() => openNotification(server)}
                >
                  <Badge content={props.unreads.find(u => u.server_id === server.server.id && u.count > 0) ? true : false}>
                    <Avatar
                      size="sm"
                      src={FailoverImg(server.server.favicon)}
                      className="server-icon"
                      alt={server.server.domain}
                      key={server.server.id}
                    />
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
            <Button appearance="link" size="lg" title={t('navigator.settings.title')}>
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
  const { t } = useTranslation()

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
        {server.account_id === null && <Dropdown.Item eventKey="0">{t('navigator.servers.authorize')}</Dropdown.Item>}
        <Dropdown.Item eventKey="1">{t('navigator.servers.remove')}</Dropdown.Item>
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
  const { t } = useTranslation()

  const handleSelect = async (eventKey: string) => {
    onClose()
    switch (eventKey) {
      case 'menu': {
        await invoke('toggle_menu')
        break
      }
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
        <Dropdown.Item eventKey="menu">{t('navigator.settings.app_menu')}</Dropdown.Item>
        <Dropdown.Item eventKey="settings">{t('navigator.settings.settings')}</Dropdown.Item>
        <Dropdown.Item eventKey="thirdparty">{t('navigator.settings.thirdparty')}</Dropdown.Item>
      </Dropdown.Menu>
    </Popover>
  )
}

export default Navigator
