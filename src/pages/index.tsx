import { useState, useEffect, useReducer, CSSProperties } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'
import { Container, Content, Message, useToaster, Animation } from 'rsuite'
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification'

import { Server } from 'src/entities/server'
import { Timeline } from 'src/entities/timeline'
import { Unread } from 'src/entities/unread'

import NewTimeline from 'src/components/timelines/New'
import ShowTimeline from 'src/components/timelines/Show'
import NewServer from 'src/components/servers/New'
import Navigator from 'src/components/Navigator'
import Compose from 'src/components/compose/Compose'
import Media from 'src/components/Media'
import generateNotification from 'src/utils/notification'
import { ReceiveNotificationPayload } from 'src/payload'
import { Entity, MegalodonInterface } from 'megalodon'
import Status from 'src/components/detail/Status'
import Thirdparty from 'src/components/settings/Thirdparty'
import { Settings } from 'src/entities/settings'
import SettingsPage from 'src/components/settings/Settings'

function App() {
  const [servers, setServers] = useState<Array<Server>>([])
  const [timelines, setTimelines] = useState<Array<[Timeline, Server]>>([])
  const [unreads, setUnreads] = useState<Array<Unread>>([])
  const [composeOpened, setComposeOpened] = useState<boolean>(false)
  const [style, setStyle] = useState<CSSProperties>({})

  const [modalState, dispatch] = useReducer(modalReducer, initialModalState)
  const [drawerState, drawerDispatch] = useReducer(drawerReducer, initialDrawerState)

  const toaster = useToaster()

  const loadTimelines = async () => {
    const timelines = await invoke<Array<[Timeline, Server]>>('list_timelines')
    setTimelines(timelines)
  }

  const message = (
    <Message showIcon type="info">
      There is no server, so please add it at first.
    </Message>
  )

  useEffect(() => {
    invoke<Array<Server>>('list_servers').then(res => {
      if (res.length === 0) {
        console.debug('There is no server')
        dispatch({ target: 'newServer', value: true })
        toaster.push(message, { placement: 'topCenter' })
      } else {
        setServers(res)
      }
    })

    loadTimelines()

    listen('updated-timelines', () => {
      loadTimelines()
    })
    listen('updated-servers', async () => {
      const res = await invoke<Array<Server>>('list_servers')
      setServers(res)
    })

    listen<ReceiveNotificationPayload>('receive-notification', async ev => {
      const server_id = ev.payload.server_id
      const target = unreads.find(u => u.server_id === server_id)
      if (target) {
        setUnreads(
          unreads.map(u => {
            if (u.server_id === server_id) {
              return Object.assign({}, u, { count: u.count + 1 })
            }
            return u
          })
        )
      } else {
        setUnreads(unreads.concat({ server_id: server_id, count: 1 }))
      }

      let permissionGranted = await isPermissionGranted()
      if (!permissionGranted) {
        const permission = await requestPermission()
        permissionGranted = permission === 'granted'
      }
      if (permissionGranted) {
        const [title, body] = generateNotification(ev.payload.notification)
        if (title.length > 0) {
          sendNotification({ title, body })
        }
      }
    })
  }, [])

  const loadAppearance = () => {
    invoke<Settings>('read_settings').then(res => {
      setStyle({
        fontSize: res.appearance.font_size
      })
    })
  }

  const toggleCompose = () => {
    setComposeOpened(previous => !previous)
  }

  return (
    <div className="container index" style={Object.assign({ backgroundColor: 'var(--rs-gray-900)' }, style)}>
      {/** Modals **/}
      <NewServer
        open={modalState.newServer.opened}
        onClose={() => dispatch({ target: 'newServer', value: false, object: null })}
        initialServer={modalState.newServer.object}
      />
      <Media
        media={modalState.media.object}
        opened={modalState.media.opened}
        close={() => dispatch({ target: 'media', value: false, object: null })}
      />
      <Thirdparty open={modalState.thirdparty.opened} onClose={() => dispatch({ target: 'thirdparty', value: false })} />
      <SettingsPage
        open={modalState.settings.opened}
        onClose={() => dispatch({ target: 'settings', value: false })}
        reloadAppearance={loadAppearance}
      />

      <Container style={{ height: '100%' }}>
        <Navigator
          servers={servers}
          unreads={unreads}
          addNewServer={() => dispatch({ target: 'newServer', value: true, object: null })}
          openAuthorize={(server: Server) => dispatch({ target: 'newServer', value: true, object: server })}
          openThirdparty={() => dispatch({ target: 'thirdparty', value: true })}
          openSettings={() => dispatch({ target: 'settings', value: true })}
          toggleCompose={toggleCompose}
        />
        <Animation.Transition
          in={composeOpened}
          exitedClassName="compose-exited"
          exitingClassName="compose-exiting"
          enteredClassName="compose-entered"
          enteringClassName="compose-entering"
        >
          {(props, ref) => (
            <div {...props} ref={ref} style={{ overflow: 'hidden' }}>
              <Compose setOpened={setComposeOpened} servers={servers} />
            </div>
          )}
        </Animation.Transition>
        <Content style={{ display: 'flex', overflowX: 'auto' }}>
          {timelines.map(timeline => (
            <ShowTimeline
              timeline={timeline[0]}
              server={timeline[1]}
              unreads={unreads}
              setUnreads={setUnreads}
              key={timeline[0].id}
              openMedia={(media: Entity.Attachment) => dispatch({ target: 'media', value: true, object: media })}
              setStatusDetail={(status, server, client) => drawerDispatch({ status: status, server: server, client: client })}
            />
          ))}
          <NewTimeline servers={servers} />
        </Content>
        <Animation.Transition
          in={drawerState.status !== null}
          exitedClassName="detail-exited"
          exitingClassName="detail-exiting"
          enteredClassName="detail-entered"
          enteringClassName="detail-entering"
        >
          {(props, ref) => (
            <div {...props} ref={ref} style={{ overflow: 'hidden' }}>
              {drawerState.status && drawerState.server && drawerState.client && (
                <Status
                  status={drawerState.status}
                  client={drawerState.client}
                  server={drawerState.server}
                  openMedia={(media: Entity.Attachment) => dispatch({ target: 'media', value: true, object: media })}
                  onClose={() => drawerDispatch({ status: null, server: null, client: null })}
                />
              )}
            </div>
          )}
        </Animation.Transition>
      </Container>
    </div>
  )
}

type ModalState = {
  newServer: {
    opened: boolean
    object: Server | null
  }
  media: {
    opened: boolean
    object: Entity.Attachment | null
  }
  thirdparty: {
    opened: boolean
  }
  settings: {
    opened: boolean
  }
}

const initialModalState: ModalState = {
  newServer: {
    opened: false,
    object: null
  },
  media: {
    opened: false,
    object: null
  },
  thirdparty: {
    opened: false
  },
  settings: {
    opened: false
  }
}

const modalReducer = (current: ModalState, action: { target: string; value: boolean; object?: any }) => {
  switch (action.target) {
    case 'newServer':
      return { ...current, newServer: { opened: action.value, object: action.object } }
    case 'media':
      return { ...current, media: { opened: action.value, object: action.object } }
    case 'thirdparty':
      return { ...current, thirdparty: { opened: action.value } }
    case 'settings':
      return { ...current, settings: { opened: action.value } }
    default:
      return current
  }
}

type DrawerState = {
  status: Entity.Status | null
  client: MegalodonInterface | null
  server: Server | null
}

const initialDrawerState: DrawerState = {
  status: null,
  client: null,
  server: null
}

const drawerReducer = (
  current: DrawerState,
  action: { status: Entity.Status | null; server: Server | null; client: MegalodonInterface | null }
) => {
  return { ...current, status: action.status, server: action.server, client: action.client }
}

export default App
