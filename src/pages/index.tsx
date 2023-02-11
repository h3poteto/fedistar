import { useState, useEffect, useReducer, CSSProperties } from 'react'
import { invoke } from '@tauri-apps/api/tauri'
import { listen } from '@tauri-apps/api/event'
import { Container, Content, useToaster, Animation } from 'rsuite'
import { isPermissionGranted, requestPermission, sendNotification } from '@tauri-apps/api/notification'

import { Server } from 'src/entities/server'
import { Timeline } from 'src/entities/timeline'
import { Unread } from 'src/entities/unread'
import alert from 'src/components/utils/alert'
import NewTimeline from 'src/components/timelines/New'
import ShowTimeline from 'src/components/timelines/Show'
import NewServer from 'src/components/servers/New'
import Navigator from 'src/components/Navigator'
import Compose from 'src/components/compose/Compose'
import Media from 'src/components/Media'
import generateNotification from 'src/utils/notification'
import { ReceiveNotificationPayload } from 'src/payload'
import { Entity } from 'megalodon'
import Thirdparty from 'src/components/settings/Thirdparty'
import { Settings } from 'src/entities/settings'
import SettingsPage from 'src/components/settings/Settings'
import Detail from 'src/components/detail/Detail'
import { useTranslation } from 'react-i18next'

function App() {
  const { t } = useTranslation()

  const [servers, setServers] = useState<Array<Server>>([])
  const [timelines, setTimelines] = useState<Array<[Timeline, Server]>>([])
  const [unreads, setUnreads] = useState<Array<Unread>>([])
  const [composeOpened, setComposeOpened] = useState<boolean>(false)
  const [style, setStyle] = useState<CSSProperties>({})

  const [modalState, dispatch] = useReducer(modalReducer, initialModalState)

  const toaster = useToaster()

  const loadTimelines = async () => {
    const timelines = await invoke<Array<[Timeline, Server]>>('list_timelines')
    setTimelines(timelines)
  }

  useEffect(() => {
    invoke<Array<Server>>('list_servers').then(res => {
      if (res.length === 0) {
        console.debug('There is no server')
        dispatch({ target: 'newServer', value: true })
        toaster.push(alert('info', t('alert.no_server')), { placement: 'topCenter' })
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
        const [title, body] = generateNotification(ev.payload.notification, t)
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
    if (servers.find(s => s.account_id !== null)) {
      setComposeOpened(previous => !previous)
    } else {
      toaster.push(alert('info', t('alert.need_auth')), { placement: 'topStart' })
    }
  }

  return (
    <div
      className="container index"
      style={Object.assign({ backgroundColor: 'var(--rs-gray-900)', width: '100%', overflow: 'hidden' }, style)}
    >
      {/** Modals **/}
      <NewServer
        open={modalState.newServer.opened}
        onClose={() => dispatch({ target: 'newServer', value: false, object: null })}
        initialServer={modalState.newServer.object}
      />
      <Media
        index={modalState.media.index}
        media={modalState.media.object}
        opened={modalState.media.opened}
        close={() => dispatch({ target: 'media', value: false, object: [], index: 0 })}
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
              openMedia={(media: Array<Entity.Attachment>, index: number) =>
                dispatch({ target: 'media', value: true, object: media, index: index })
              }
            />
          ))}
          <NewTimeline servers={servers} />
        </Content>
        <Detail
          dispatch={dispatch}
          openMedia={(media: Array<Entity.Attachment>, index: number) =>
            dispatch({ target: 'media', value: true, object: media, index: index })
          }
        />
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
    object: Array<Entity.Attachment>
    index: number
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
    object: [],
    index: 0
  },
  thirdparty: {
    opened: false
  },
  settings: {
    opened: false
  }
}

const modalReducer = (current: ModalState, action: { target: string; value: boolean; object?: any; index?: number }) => {
  switch (action.target) {
    case 'newServer':
      return { ...current, newServer: { opened: action.value, object: action.object } }
    case 'media':
      return { ...current, media: { opened: action.value, object: action.object, index: action.index } }
    case 'thirdparty':
      return { ...current, thirdparty: { opened: action.value } }
    case 'settings':
      return { ...current, settings: { opened: action.value } }
    default:
      return current
  }
}

export default App
