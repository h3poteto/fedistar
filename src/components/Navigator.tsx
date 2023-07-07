import { invoke } from '@tauri-apps/api/tauri'
import { Dispatch, ReactElement, SetStateAction, useEffect, useState } from 'react'
import { Icon } from '@rsuite/icons'
import { Popover, Dropdown, Sidebar, Sidenav, Whisper, Button, Avatar, Badge, FlexboxGrid, useToaster } from 'rsuite'
import { BsPlus, BsGear, BsPencilSquare } from 'react-icons/bs'
import { Server, ServerSet } from 'src/entities/server'
import { Account } from 'src/entities/account'
import { Timeline } from 'src/entities/timeline'
import FailoverImg from 'src/utils/failoverImg'
import { Unread } from 'src/entities/unread'
import { Marker } from 'src/entities/marker'
import { Instruction } from 'src/entities/instruction'
import { listen } from '@tauri-apps/api/event'
import alert from 'src/components/utils/alert'
import generator, { Entity } from 'megalodon'
import { useRouter } from 'next/router'
import { FormattedMessage, useIntl } from 'react-intl'

type NavigatorProps = {
  servers: Array<ServerSet>
  unreads: Array<Unread>
  addNewServer: () => void
  openAuthorize: (server: Server) => void
  openAnnouncements: (server: Server, account: Account) => void
  toggleCompose: () => void
  openThirdparty: () => void
  openSettings: () => void
  setHighlighted: Dispatch<SetStateAction<Timeline>>
  setUnreads: Dispatch<SetStateAction<Array<Unread>>>
}

const Navigator: React.FC<NavigatorProps> = (props): ReactElement => {
  const { formatMessage } = useIntl()
  const { servers, openAuthorize, openAnnouncements, openThirdparty, openSettings } = props
  const [walkthrough, setWalkthrough] = useState(false)
  const toaster = useToaster()

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

  useEffect(() => {
    props.servers.map(async set => {
      if (!set.account) return set
      const client = generator(set.server.sns, set.server.base_url, set.account.access_token, 'Fedistar')
      try {
        const notifications = (await client.getNotifications()).data
        const res = await client.getMarkers(['notifications'])
        const marker = res.data as Entity.Marker
        if (marker.notifications) {
          const count = unreadCount(marker.notifications, notifications)

          const target = props.unreads.find(u => u.server_id === set.server.id)
          if (target) {
            props.setUnreads(unreads =>
              unreads.map(u => {
                if (u.server_id === set.server.id) {
                  return Object.assign({}, u, { count: count })
                }
                return u
              })
            )
          } else {
            props.setUnreads(unreads => unreads.concat({ server_id: set.server.id, count: count }))
          }
        }
      } catch (err) {
        console.error(err)
      }
      return set
    })
  }, [props.servers])

  const closeWalkthrough = async () => {
    setWalkthrough(false)
    await invoke('update_instruction', { step: 3 })
  }

  const openNotification = async (set: ServerSet) => {
    if (!props.unreads.find(u => u.server_id === set.server.id && u.count > 0)) return
    const timelines = await invoke<Array<[Timeline, Server]>>('list_timelines')
    let target = timelines.find(t => t[1].id === set.server.id && t[0].kind === 'notifications')
    if (target === undefined || target === null) {
      await invoke('add_timeline', { server: set.server, kind: 'notifications', name: 'Notifications', columnWidth: 'sm' })
      const timelines = await invoke<Array<[Timeline, Server]>>('list_timelines')
      target = timelines.find(t => t[1].id === set.server.id && t[0].kind === 'notifications')
      if (target === undefined || target === null) {
        toaster.push(alert('error', formatMessage({ id: 'alert.notifications_not_found' })), { placement: 'topStart' })
      }
    }

    props.setHighlighted(current => {
      if (current && current.id === target[0].id) {
        return current
      }
      setTimeout(() => {
        props.setHighlighted(null)
      }, 5000)
      return target[0]
    })

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
          <Button appearance="link" size="lg" onClick={props.addNewServer} title={formatMessage({ id: 'navigator.add_server.title' })}>
            <Icon as={BsPlus} style={{ fontSize: '1.4em' }} />
          </Button>
          {walkthrough && (
            <div style={{ position: 'relative' }}>
              <Popover arrow={false} visible={walkthrough} style={{ left: 12, top: 'auto', bottom: 0 }}>
                <div style={{ width: '120px' }}>
                  <h4 style={{ fontSize: '1.2em' }}>
                    <FormattedMessage id="walkthrough.navigator.servers.title" />
                  </h4>
                  <p>
                    <FormattedMessage id="walkthrough.navigator.servers.description" />
                  </p>
                </div>
                <FlexboxGrid justify="end">
                  <Button appearance="default" size="xs" onClick={closeWalkthrough}>
                    <FormattedMessage id="walkthrough.navigator.servers.ok" />
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
                  serverMenu(
                    {
                      className,
                      left,
                      top,
                      onClose,
                      server,
                      openAuthorize,
                      openAnnouncements
                    },
                    ref
                  )
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
            <Button appearance="link" size="lg" title={formatMessage({ id: 'navigator.settings.title' })}>
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
  server: ServerSet
  openAuthorize: (server: Server) => void
  openAnnouncements: (server: Server, account: Account) => void
}

const serverMenu = (
  { className, left, top, onClose, server, openAuthorize, openAnnouncements }: ServerMenuProps,
  ref: React.RefCallback<HTMLElement>
): ReactElement => {
  const router = useRouter()

  const handleSelect = (eventKey: string) => {
    onClose()
    switch (eventKey) {
      case 'authorize':
        openAuthorize(server.server)
        break
      case 'profile':
        router.push({ query: { user_id: server.account.account_id, server_id: server.server.id, account_id: server.account.id } })
        break
      case 'remove':
        invoke('remove_server', { id: server.server.id })
        break
      case 'announcements':
        openAnnouncements(server.server, server.account)
        break
      case 'lists':
        router.push({ query: { lists: 'all', server_id: server.server.id, account_id: server.account.id } })
        break
    }
  }
  return (
    <Popover ref={ref} className={className} style={{ left, top, padding: 0 }}>
      <Dropdown.Menu onSelect={handleSelect}>
        {server.server.account_id === null && (
          <Dropdown.Item eventKey="authorize">
            <FormattedMessage id="navigator.servers.authorize" />
          </Dropdown.Item>
        )}
        {server.server.account_id !== null && (
          <Dropdown.Item eventKey="profile">
            <FormattedMessage id="navigator.servers.profile" />
          </Dropdown.Item>
        )}
        {server.server.account_id !== null && (
          <>
            <Dropdown.Item eventKey="announcements">
              <FormattedMessage id="navigator.servers.announcements" />
            </Dropdown.Item>
            <Dropdown.Item eventKey="lists">
              <FormattedMessage id="navigator.servers.lists" />
            </Dropdown.Item>
          </>
        )}
        <Dropdown.Item eventKey="remove">
          <FormattedMessage id="navigator.servers.remove" />
        </Dropdown.Item>
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
        <Dropdown.Item eventKey="menu">
          <FormattedMessage id="navigator.settings.app_menu" />
        </Dropdown.Item>
        <Dropdown.Item eventKey="settings">
          <FormattedMessage id="navigator.settings.settings" />
        </Dropdown.Item>
        <Dropdown.Item eventKey="thirdparty">
          <FormattedMessage id="navigator.settings.thirdparty" />
        </Dropdown.Item>
      </Dropdown.Menu>
    </Popover>
  )
}

const unreadCount = (marker: Marker, notifications: Array<Entity.Notification>): number => {
  if (marker.unread_count !== undefined) {
    return marker.unread_count
  }
  return notifications.filter(n => parseInt(n.id) > parseInt(marker.last_read_id)).length
}

export default Navigator
